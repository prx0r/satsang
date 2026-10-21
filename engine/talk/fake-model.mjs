// Satsang /talk/ mock · a scripted fake realtime model that speaks the real Qwen Omni Realtime wire protocol (no key, no network).
// It is a WebSocket-like object: the adapter (rt/qwen-adapter.mjs) talks to it exactly as it would talk to the relay.
// MOCK ONLY: there is no speech recognition here, so the "audio" a turn appends is the UTF-8 bytes of its transcript;
// the fake decodes them as its ASR. Real sessions send PCM16 and the provider transcribes.
//
// Rules (first match wins): slower → replay_phase{slow:true} · again/show me/lost → replay_phase{} · longer hold → extend_pause{15}
// (refused by the bus during breathing; a guard demo) · gentler/easier → set_level{gentler} · how/why/ida/pingala → show_explainer
// {why} + an answer · continue/ready → resume · where am i → get_practice_context · otherwise a short reply.

const enc = new TextEncoder(), dec = new TextDecoder()
export const mockAudioFor = text => { const u8 = enc.encode(String(text)); let s = ''; for (const b of u8) s += String.fromCharCode(b); return btoa(s) }
const fromB64 = b64 => { const s = atob(b64), u8 = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i); return dec.decode(u8) }

const RULES = [
  [/\bslow(er|ly)?\b|\btoo fast\b/, () => ({ call: ['replay_phase', { slow: true }] })],
  [/\bagain\b|\bshow me\b|\blost (the )?count\b|\bmissed\b/, () => ({ call: ['replay_phase', {}] })],
  [/\blonger\b|\bhold (it )?more\b/, () => ({ call: ['extend_pause', { seconds: 15 }] })],
  [/\bgentl\w*|\beasier\b|\bbeginner\b/, () => ({ call: ['set_level', { level: 'gentler' }] })],
  [/\bhow\b|\bwhy\b|\bida\b|\bpingala\b|\bwork\b/, () => ({ call: ['show_explainer', { card: 'why' }] })],
  [/\bcontinue\b|\bready\b|\bgo on\b|\bresume\b/, () => ({ call: ['resume', {}] })],
  [/\bwhere am i\b|\bwhich (phase|round)\b/, () => ({ call: ['get_practice_context', {}] })],
]
const FOLLOW = {
  replay_phase: (o, a) => o.ok ? (a.slow ? "Of course. Let's take that breath again, slowly. Follow the light up the channel, then we carry on." : "Here it is again. Just follow the light, then we carry on.") : refuse(o),
  extend_pause: o => o.ok ? "Let's rest in the quiet a little longer." : "I can't lengthen the holds, and that keeps the practice safe. If it feels like a lot, I can make it gentler.",
  set_level: o => o.ok ? "Done. It's gentler now: no holds, just smooth breathing in and out." : refuse(o),
  show_explainer: o => o.ok ? 'Breathing through one nostril, then the other, gives an even, steady rhythm. In the yoga texts the two sides are called ida and pingala. The card shows the source.' : refuse(o),
  resume: o => o.ok ? "Let's carry on together." : refuse(o),
  get_practice_context: o => o.ok ? `You're in round ${o.context?.round || 1}, ${o.context?.phase?.phase === 'in' ? 'breathing in' : o.context?.phase?.phase === 'out' ? 'breathing out' : 'resting'}.` : refuse(o),
}
function refuse(o) { return o.reason === 'locked_after_safety' ? "Let's stay with gentle breathing for now." : "I can't do that one here, but we can keep it simple and steady." }

/**
 * @param {object} [o] { schedule: f => void (default: run now; the page passes a paced queue), chunks: audio chunks per reply }
 */
export function createFakeRealtime({ schedule = f => f(), chunks = 4 } = {}) {
  let n = 0
  const uid = p => `${p}_${(++n).toString(36)}`
  const st = { session: null, buf: '', lastTranscript: '', outputs: [], lastCall: null, resp: null, received: [], heard: [] }
  const sock = {
    readyState: 1, onopen: null, onmessage: null, onclose: null, onerror: null,
    send(raw) { const ev = JSON.parse(raw); st.received.push(ev); recv(ev) },
    close() { sock.readyState = 3; sock.onclose?.({}) },
    // test/page helpers
    get state() { return st },
    /** open-mic: the server VAD heard speech onset */
    speechStarted() { push({ type: 'input_audio_buffer.speech_started', audio_start_ms: 0, item_id: uid('item') }) },
    /** start a long spoken answer that never finishes on its own (to demonstrate barge-in) */
    beginLongAnswer(text = 'Ida and pingala are the two channels that the yoga texts describe on either side of the spine, and alternate nostril breathing is said to balance them over many rounds of practice...') {
      const id = uid('resp'); st.resp = id
      push({ type: 'response.created', response: { id, status: 'in_progress' } })
      for (const w of text.split(' ').slice(0, 6)) push({ type: 'response.audio_transcript.delta', response_id: id, delta: w + ' ' })
      for (let i = 0; i < chunks; i++) push({ type: 'response.audio.delta', response_id: id, delta: silence(480) })
      return id
    },
  }
  function push(ev) { schedule(() => sock.onmessage?.({ data: JSON.stringify({ event_id: uid('event'), ...ev }) })) }
  function recv(ev) {
    switch (ev.type) {
      case 'session.update': st.session = ev.session; push({ type: 'session.updated', session: { ...ev.session, model: 'fake-qwen3.8-omni-flash-realtime' } }); break
      case 'input_audio_buffer.append': try { st.buf += fromB64(ev.audio) } catch { } break
      case 'input_audio_buffer.clear': st.buf = ''; push({ type: 'input_audio_buffer.cleared' }); break
      case 'input_audio_buffer.commit': {
        const item = uid('item'); st.lastTranscript = st.buf; st.heard.push(st.buf); st.buf = ''
        push({ type: 'input_audio_buffer.committed', item_id: item })
        push({ type: 'conversation.item.input_audio_transcription.completed', item_id: item, content_index: 0, transcript: st.lastTranscript })
        break
      }
      case 'conversation.item.create': if (ev.item?.type === 'function_call_output') st.outputs.push(ev.item); break
      case 'response.cancel': if (st.resp) { const id = st.resp; st.resp = null; push({ type: 'response.done', response: { id, status: 'cancelled', output: [] } }) } break
      case 'response.create': respond(); break
    }
  }
  function respond() {
    const id = uid('resp'); st.resp = id
    push({ type: 'response.created', response: { id, status: 'in_progress' } })
    if (st.outputs.length) {             // continuation after our tool call: speak the follow-up
      const outs = st.outputs.splice(0); const o = JSON.parse(outs[outs.length - 1].output)
      const [name, args] = st.lastCall || ['', {}]
      say(id, (FOLLOW[name] || (() => 'Okay.'))(o, args))
      return
    }
    const t = st.lastTranscript.toLowerCase()
    const rule = RULES.find(([re]) => re.test(t))
    if (rule) {
      const { call: [name, args] } = rule[1](); st.lastCall = [name, args]
      const item = uid('item'), call_id = uid('call')
      push({ type: 'response.output_item.added', response_id: id, output_index: 0, item: { id: item, type: 'function_call', status: 'in_progress', call_id, name, arguments: '' } })
      push({ type: 'response.function_call_arguments.done', response_id: id, item_id: item, output_index: 0, call_id, name, arguments: JSON.stringify(args) })
      push({ type: 'response.done', response: { id, status: 'completed', output: [{ id: item, type: 'function_call', call_id, name, arguments: JSON.stringify(args) }] } })
      st.resp = null
      return
    }
    say(id, "I'm here. Would you like to carry on, or go gentler?")
  }
  function say(id, text) {
    const item = uid('item')
    for (const w of text.split(' ')) push({ type: 'response.audio_transcript.delta', response_id: id, item_id: item, delta: w + ' ' })
    for (let i = 0; i < chunks; i++) push({ type: 'response.audio.delta', response_id: id, item_id: item, delta: silence(480) })
    push({ type: 'response.audio_transcript.done', response_id: id, item_id: item, transcript: text })
    push({ type: 'response.audio.done', response_id: id, item_id: item })
    push({ type: 'response.done', response: { id, status: 'completed', output: [{ id: item, type: 'message', role: 'assistant', content: [{ type: 'audio', transcript: text }] }] } })
    st.resp = null
  }
  return sock
}
function silence(samples) { return btoa(String.fromCharCode(...new Uint8Array(samples * 2))) }
