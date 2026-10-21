// Satsang realtime relay · pure policy (node-testable): origin check, client-event filter, per-session caps.
// The relay is the only holder of the Model Studio key. The browser can only send this narrow set of events, with clamped fields.

export const DEFAULT_ORIGINS = ['https://engine.tantrafiles.xyz', 'https://tantrafiles.xyz', 'https://www.tantrafiles.xyz',
  'https://satsang.digital', 'https://www.satsang.digital']
export const ALLOWED_MCP = ['https://mcp.tantrafiles.xyz/mcp', 'https://mcp.satsang.digital/mcp']
export const CAPS = {
  session_s: 15 * 60,            // hard wall-clock cap per socket
  idle_s: 120,                   // close after 2 min without client events
  audio_in_s: 5 * 60,            // max seconds of input audio per session (PCM16 mono)
  input_rate: 16000,
  msg_bytes: 96 * 1024,          // one client frame
  append_b64: 64 * 1024,         // one input_audio_buffer.append payload
  instructions_chars: 12000,
  tools: 24,
  output_chars: 8192,            // function_call_output
  max_tokens: 600,
  responses: 120,                // response.create per session
}

export function originAllowed(origin, extra = '') {
  if (!origin) return false
  const list = [...DEFAULT_ORIGINS, ...String(extra || '').split(',').map(s => s.trim()).filter(Boolean)]
  return list.includes(origin)
}

export function newSessionState() { return { audioBytes: 0, responses: 0, started: Date.now(), last: Date.now() } }

const SESSION_KEYS = new Set(['modalities', 'instructions', 'voice', 'audio', 'input_audio_format', 'output_audio_format', 'input_audio_transcription',
  'turn_detection', 'tools', 'temperature', 'top_p', 'max_tokens', 'smooth_output'])

/**
 * @returns {{ok: true, data: string} | {ok: false, reason: string, close?: boolean}}
 */
export function filterClientEvent(raw, st, caps = CAPS) {
  if (typeof raw !== 'string') return { ok: false, reason: 'binary_frames_not_accepted' }
  if (raw.length > caps.msg_bytes) return { ok: false, reason: 'frame_too_large' }
  let ev; try { ev = JSON.parse(raw) } catch { return { ok: false, reason: 'not_json' } }
  if (!ev || typeof ev.type !== 'string') return { ok: false, reason: 'no_type' }
  st.last = Date.now()
  const out = { type: ev.type }; if (typeof ev.event_id === 'string') out.event_id = ev.event_id.slice(0, 64)
  switch (ev.type) {
    case 'session.update': {
      const s = ev.session || {}, o = {}
      for (const [k, v] of Object.entries(s)) if (SESSION_KEYS.has(k)) o[k] = v
      if (typeof o.instructions === 'string') o.instructions = o.instructions.slice(0, caps.instructions_chars)
      if (o.max_tokens != null) o.max_tokens = Math.max(1, Math.min(caps.max_tokens, +o.max_tokens || caps.max_tokens)); else o.max_tokens = caps.max_tokens
      if (Array.isArray(o.tools)) {
        o.tools = o.tools.slice(0, caps.tools).filter(t => t?.type === 'function' || (t?.type === 'mcp' && ALLOWED_MCP.includes(t.server_url)))
          .map(t => t.type === 'mcp' ? { type: 'mcp', server_label: String(t.server_label || 'satsang').slice(0, 64), server_url: t.server_url, allowed_tools: t.allowed_tools, require_approval: 'never' } : t)
      }
      o.enable_search = false                      // cost + grounding: no web search
      if (o.input_audio_transcription) o.input_audio_transcription = { model: 'qwen3-asr-flash-realtime' }
      out.session = o; break
    }
    case 'input_audio_buffer.append': {
      if (typeof ev.audio !== 'string' || ev.audio.length > caps.append_b64) return { ok: false, reason: 'bad_audio' }
      st.audioBytes += Math.floor(ev.audio.length * 3 / 4)
      if (st.audioBytes > caps.audio_in_s * caps.input_rate * 2) return { ok: false, reason: 'audio_cap', close: true }
      out.audio = ev.audio; break
    }
    case 'input_audio_buffer.commit': case 'input_audio_buffer.clear': case 'response.cancel': break
    case 'response.create': {
      if (++st.responses > caps.responses) return { ok: false, reason: 'response_cap', close: true }
      break                                      // per-response overrides are dropped (instructions/tools stay as the session set them)
    }
    case 'conversation.item.create': {
      const it = ev.item || {}
      if (it.type !== 'function_call_output' || typeof it.call_id !== 'string' || typeof it.output !== 'string') return { ok: false, reason: 'item_type_not_allowed' }
      out.item = { type: 'function_call_output', call_id: it.call_id.slice(0, 128), output: it.output.slice(0, caps.output_chars) }
      break
    }
    default: return { ok: false, reason: 'event_not_allowed' }
  }
  return { ok: true, data: JSON.stringify(out) }
}

export function sessionExpired(st, caps = CAPS, now = Date.now()) {
  if (now - st.started > caps.session_s * 1000) return 'session_cap'
  if (now - st.last > caps.idle_s * 1000) return 'idle'
  return null
}
