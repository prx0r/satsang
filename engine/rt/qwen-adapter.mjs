// Satsang realtime layer · realtime model client (Qwen Omni Realtime first, OpenAI-Realtime-compatible dialect second).
// The browser connects to OUR relay (rt/relay-worker), never to the provider: the bearer key lives only in the relay's secret.
//   upstream (relay side): wss://{WorkspaceId}.ap-southeast-1.maas.aliyuncs.com/api-ws/v1/realtime?model=qwen3.8-omni-flash-realtime
//
// Event handling (Model Studio server events, read 2026-10-21):
//   input_audio_buffer.speech_started              → barge-in: stop model audio, cancel the response, bus.interrupt (duck narration,
//                                                     release a hold, pause)
//   conversation.item.input_audio_transcription.completed → late safety net (VAD mode): triage the server transcript too
//   response.function_call_arguments.done          → tools.dispatchTool → bus (guards) → conversation.item.create
//                                                     { type: function_call_output, call_id, output } → response.create (after response.done)
//   response.audio.delta | response.output_audio.delta → PCM16 24 kHz playback
//
// Modes: 'ptt' (default; turn_detection null). The person holds to talk; audio is buffered locally while the browser transcribes it;
//   on release the transcript is triaged FIRST and only a clean turn is sent (append → commit → response.create). A safety hit never
//   reaches the model. 'vad' (opt-in open mic): audio streams continuously with server semantic VAD; triage then runs on the
//   local transcript as soon as it arrives and again on the server transcript, cancelling the model's turn on a hit.
import { triage as defaultTriage, applyTriage as defaultApply, localCommand } from './safety.mjs'
import { toolSpecs, toQwen, toOpenAI, dispatchTool } from './tools.mjs'

export const QWEN_MODEL = 'qwen3.8-omni-flash-realtime'
export const qwenUpstreamUrl = (workspaceId, model = QWEN_MODEL) =>
  `wss://${workspaceId}.ap-southeast-1.maas.aliyuncs.com/api-ws/v1/realtime?model=${encodeURIComponent(model)}`

export function sessionConfig({ dialect = 'qwen', instructions = '', specs = [], voice = null, mode = 'ptt', maxTokens = 400 } = {}) {
  const vad = mode === 'vad'
  if (dialect === 'openai') return {
    type: 'realtime', instructions, tools: toOpenAI(specs), tool_choice: 'auto', max_output_tokens: maxTokens,
    audio: { input: { format: { type: 'audio/pcm', rate: 24000 }, turn_detection: vad ? { type: 'semantic_vad', interrupt_response: true, create_response: true } : null },
      output: { format: { type: 'audio/pcm', rate: 24000 }, ...(voice ? { voice } : {}) } },
  }
  return {
    modalities: ['text', 'audio'], instructions, tools: toQwen(specs),
    input_audio_format: 'pcm', output_audio_format: 'pcm',
    input_audio_transcription: { model: 'qwen3-asr-flash-realtime' },
    turn_detection: vad ? { type: 'semantic_vad', threshold: 0.5, silence_duration_ms: 700 } : null,
    enable_search: false, max_tokens: maxTokens, temperature: 0.6,
    ...(voice ? { audio: { output: { voice } } } : {}),
  }
}

export function createRealtimeClient(o) {
  const {
    url = null, socket = null, WebSocketImpl = globalThis.WebSocket, dialect = 'qwen', bus, practice = null, grammar = null,
    mode = 'ptt', instructions = '', voice = null, audioOut = null, qa = null, onEvent = () => { }, maxToolHops = 3,
    triage = defaultTriage, applyTriage = defaultApply, inputRate = dialect === 'openai' ? 24000 : 16000,
  } = o
  const specs = toolSpecs({ timeline: o.timeline || null, grammar })
  const S = { ws: socket, ready: false, responseActive: false, respId: null, cancelled: new Set(), pendingOutputs: 0, hops: 0, closed: false,
    stats: { modelTurns: 0, safetyHits: 0, localCommands: 0, toolCalls: 0, refused: 0, bargeIns: 0, audioChunks: 0 } }
  let seq = 0
  const id = () => `evt_${Date.now().toString(36)}_${(++seq).toString(36)}`
  const send = ev => { if (!S.ws || S.closed) return false; const e = { event_id: id(), ...ev }; S.ws.send(JSON.stringify(e)); onEvent({ dir: 'out', type: e.type, e }); return true }
  const ctx = () => ({ practice, timeline: o.timeline || null })

  function connect() {
    return new Promise((resolve, reject) => {
      if (!S.ws) { if (!url) return reject(new Error('relay url required')); S.ws = new WebSocketImpl(url) }
      const ws = S.ws
      const onOpen = () => send({ type: 'session.update', session: sessionConfig({ dialect, instructions, specs, voice, mode }) })
      ws.onopen = onOpen
      ws.onmessage = m => { let ev; try { ev = JSON.parse(typeof m.data === 'string' ? m.data : new TextDecoder().decode(m.data)) } catch { return } handle(ev, resolve) }
      ws.onerror = e => { onEvent({ dir: 'in', type: 'socket.error', e }); if (!S.ready) reject(new Error('socket error')) }
      ws.onclose = () => { S.closed = true; onEvent({ dir: 'in', type: 'socket.closed' }) }
      if (ws.readyState === 1) onOpen()
    })
  }

  function handle(ev, resolveReady) {
    onEvent({ dir: 'in', type: ev.type, e: ev })
    const rid = ev.response_id || ev.response?.id || null
    const dropped = rid != null && S.cancelled.has(rid)   // events of a response we cancelled (barge-in / safety)
    switch (ev.type) {
      case 'session.updated': if (!S.ready) { S.ready = true; resolveReady?.() } break
      case 'input_audio_buffer.speech_started': bargeIn('server_vad'); break
      case 'conversation.item.input_audio_transcription.completed': {
        if (mode !== 'vad') break                 // PTT turns were triaged before sending
        const t = triage(ev.transcript || '', ctx())
        if (t.class !== 'none' && !t.model) safetyStop(t)
        break
      }
      case 'response.created': S.responseActive = true; S.respId = rid; S.stats.modelTurns++; break
      case 'response.audio.delta': case 'response.output_audio.delta':
        if (!dropped && audioOut && ev.delta) { audioOut.enqueue(b64ToInt16(ev.delta)); S.stats.audioChunks++ } break
      case 'response.audio_transcript.delta': case 'response.output_audio_transcript.delta':
        if (!dropped) onEvent({ dir: 'model', type: 'text.delta', text: ev.delta }); break
      case 'response.audio_transcript.done': case 'response.output_audio_transcript.done':
        if (!dropped) onEvent({ dir: 'model', type: 'text.done', text: ev.transcript }); break
      case 'response.function_call_arguments.done': {
        if (dropped) break
        S.stats.toolCalls++
        const output = dispatchTool(bus, ev.name, ev.arguments, { specs, qa })
        try { if (!JSON.parse(output).ok) S.stats.refused++ } catch { }
        onEvent({ dir: 'tool', type: 'tool.result', name: ev.name, arguments: ev.arguments, output })
        send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: ev.call_id, output } })
        S.pendingOutputs++
        break
      }
      case 'response.done':
        if (rid === S.respId) S.responseActive = false
        if (dropped) { S.cancelled.delete(rid); break }
        if (S.pendingOutputs > 0) {
          S.pendingOutputs = 0
          if (S.hops < maxToolHops && !bus?.state?.ended) { S.hops++; send({ type: 'response.create' }) }
          else onEvent({ dir: 'in', type: 'tool.hops_exhausted' })
        }
        break
      case 'error': onEvent({ dir: 'in', type: 'model.error', error: ev.error }); break
    }
  }

  /** The person started talking (button press, local VAD or server VAD). */
  function bargeIn(why = 'user') {
    S.stats.bargeIns++
    audioOut?.stop?.()
    if (S.responseActive) { send({ type: 'response.cancel' }); if (S.respId) S.cancelled.add(S.respId); S.responseActive = false; S.pendingOutputs = 0 }
    return bus?.exec('interrupt', {}, { source: 'system' })
  }

  function safetyStop(t) {
    S.stats.safetyHits++
    audioOut?.stop?.()
    if (S.responseActive) { send({ type: 'response.cancel' }); if (S.respId) S.cancelled.add(S.respId); S.responseActive = false; S.pendingOutputs = 0 }
    if (mode === 'vad') send({ type: 'input_audio_buffer.clear' })
    const results = applyTriage(bus, t)
    onEvent({ dir: 'safety', type: 'safety.triggered', class: t.class, intent: t.intent, say: t.say, results })
    return results
  }

  /**
   * A finished push-to-talk turn: the local transcript decides the route before anything leaves the device.
   * @param {{transcript: string, audio?: Array<Int16Array|string>}} turn  audio chunks: PCM16 at inputRate or base64 strings
   */
  function userTurn({ transcript = '', audio = [] } = {}) {
    const local = localCommand(transcript)
    if (local) { S.stats.localCommands++; const r = bus.exec(local[0], local[1] || {}, { source: 'user' }); onEvent({ dir: 'local', type: 'local.command', cmd: local[0], result: r }); return { routed: 'local', result: r } }
    const t = triage(transcript, ctx())
    if (t.class !== 'none' && !t.model) { const results = safetyStop(t); return { routed: 'safety', triage: t, results } }
    if (!audio.length) return { routed: 'none', reason: 'no_audio' }
    for (const c of audio) for (const b64 of chunkB64(c)) send({ type: 'input_audio_buffer.append', audio: b64 })
    if (mode !== 'vad') send({ type: 'input_audio_buffer.commit' })
    S.hops = 0
    if (mode !== 'vad') send({ type: 'response.create' })
    return { routed: 'model', triage: t }
  }

  /** Open-mic streaming (mode 'vad'): forward a mic chunk. */
  function appendAudio(chunk) { if (mode !== 'vad') return false; for (const b64 of chunkB64(chunk)) send({ type: 'input_audio_buffer.append', audio: b64 }); return true }
  /** Open-mic: a local (browser) transcript arrived for the current utterance; triage it at once. */
  function localTranscript(text) { const t = triage(text, ctx()); if (t.class !== 'none' && !t.model) return { routed: 'safety', results: safetyStop(t) }; const l = localCommand(text); if (l) { S.stats.localCommands++; return { routed: 'local', result: bus.exec(l[0], l[1] || {}, { source: 'user' }) } } return { routed: 'model' } }

  function close() { S.closed = true; try { S.ws?.close() } catch { } }
  return { connect, userTurn, bargeIn, appendAudio, localTranscript, close, handle, get stats() { return { ...S.stats } }, get ready() { return S.ready }, specs, inputRate }
}

// ---------- audio helpers ----------
export function int16ToB64(a) {
  const u8 = a instanceof Uint8Array ? a : new Uint8Array(a.buffer, a.byteOffset, a.byteLength)
  let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000))
  return btoa(s)
}
export function b64ToInt16(b64) {
  const s = atob(b64), u8 = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i)
  return new Int16Array(u8.buffer, 0, u8.length >> 1)
}
function chunkB64(c, max = 32000) {   // ≤ 32 KB of base64 per append event
  const b64 = typeof c === 'string' ? c : int16ToB64(c)
  const out = []; for (let i = 0; i < b64.length; i += max) out.push(b64.slice(i, i + max)); return out
}

/** Browser: schedule PCM16 chunks on Web Audio; stop() cuts instantly (barge-in); duck(g) lowers it. */
export function createPcmPlayer(ac, { sampleRate = 24000 } = {}) {
  const gain = ac.createGain(); gain.connect(ac.destination)
  let at = 0; const live = new Set()
  return {
    enqueue(i16) {
      const f = new Float32Array(i16.length); for (let i = 0; i < i16.length; i++) f[i] = i16[i] / 32768
      const buf = ac.createBuffer(1, f.length, sampleRate); buf.copyToChannel(f, 0)
      const src = ac.createBufferSource(); src.buffer = buf; src.connect(gain)
      at = Math.max(at, ac.currentTime + 0.03); src.start(at); at += buf.duration
      live.add(src); src.onended = () => live.delete(src)
    },
    stop() { for (const s of live) try { s.stop() } catch { } live.clear(); at = 0 },
    duck(g = 0.25) { gain.gain.setTargetAtTime(g, ac.currentTime, 0.05) },
    get playing() { return live.size > 0 },
  }
}

/** Browser: microphone → PCM16 chunks at `rate` (ScriptProcessor for reach; ~100 ms chunks). */
export async function createMicCapture({ rate = 16000, onChunk } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } })
  const ac = new (window.AudioContext || window.webkitAudioContext)()
  const srcNode = ac.createMediaStreamSource(stream), proc = ac.createScriptProcessor(4096, 1, 1)
  const ratio = ac.sampleRate / rate
  proc.onaudioprocess = e => {
    const x = e.inputBuffer.getChannelData(0), n = Math.floor(x.length / ratio), o16 = new Int16Array(n)
    for (let i = 0; i < n; i++) { const v = Math.max(-1, Math.min(1, x[Math.floor(i * ratio)])); o16[i] = v < 0 ? v * 32768 : v * 32767 }
    onChunk?.(o16)
  }
  srcNode.connect(proc); proc.connect(ac.destination)
  return { stop() { proc.disconnect(); srcNode.disconnect(); stream.getTracks().forEach(t => t.stop()); ac.close() } }
}
