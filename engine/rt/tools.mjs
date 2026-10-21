// Satsang realtime layer · tool declarations for the realtime model, in both provider shapes, plus the dispatcher.
//   Qwen Omni Realtime (session.update.session.tools): { type: 'function', function: { name, description, parameters } }
//   OpenAI Realtime   (session.update.session.tools): { type: 'function', name, description, parameters }
// Tool names map 1:1 to bus commands except end_session → end, get_practice_context and lookup_qa (read-only, answered here).
// 'play' and 'speak' are not model tools: the model resumes with `resume` and speaks with its own voice.
// Every argument is validated here (types, enums, ranges, no extra keys) before the bus sees it; the bus then applies its guards.

const STR = (description, extra = {}) => ({ type: 'string', description, ...extra })
const INT = (description, minimum, maximum) => ({ type: 'integer', description, minimum, maximum })

/** Tool specs for one practice. Pass the compiled timeline (phase ids become an enum) and grammar (locus enum). */
export function toolSpecs({ timeline = null, grammar = null } = {}) {
  const phases = [...new Set((timeline?.tracks?.breath || []).map(b => b.id).filter(Boolean))].slice(0, 80)
  const loci = Object.keys(grammar?.loci || {}).slice(0, 80)
  const rounds = (timeline?.tracks?.markers || []).filter(m => m.kind === 'round').length || 1
  const phase = phases.length ? STR('Phase id from get_practice_context, e.g. "in-L" or "out-R".', { enum: phases }) : STR('Phase id from get_practice_context.')
  return [
    { name: 'pause', description: 'Pause the practice at a safe point (a hold is released first). Use when the person asks to stop for a moment.', parameters: obj({}) },
    { name: 'resume', description: 'Resume the practice from where it paused.', parameters: obj({}) },
    { name: 'seek_phase', description: 'Move to a phase of the practice. Moving back into earlier holds or rounds is refused when it would add breath-holding beyond the session.', parameters: obj({ phase, round: INT('Round number (1-based); default the current round.', 1, rounds), which: STR('Relative move instead of a phase id.', { enum: ['previous', 'current', 'next'] }) }) },
    { name: 'replay_phase', description: 'Show a breath phase again, optionally slower, then continue. Use for "slower please", "show me again", "I lost the count". Holds are never replayed or slowed.', parameters: obj({ phase: { ...phase, description: 'Phase to replay; default the phase just interrupted.' }, round: INT('Round of that phase.', 1, rounds), slow: { type: 'boolean', description: 'Play it at a slower pace (0.75x).' } }) },
    { name: 'repeat_round', description: 'Repeat a whole round. If the session has no rounds to spare, a later round is skipped so the total never grows; refused on the last round.', parameters: obj({ round: INT('Round to repeat; default the current one.', 1, rounds) }) },
    { name: 'set_level', description: 'Make the practice gentler (no long holds, beginner counts) or return to standard if the session started there. Fewer rounds allowed; never more.', parameters: obj({ level: STR('gentler or standard.', { enum: ['gentler', 'standard'] }), rounds: INT('Fewer rounds than now.', 1, rounds) }) },
    { name: 'extend_pause', description: 'Lengthen the current silent pause (a rest or a contemplative pause only, never a breath-hold), up to 20 seconds at a time.', parameters: obj({ seconds: INT('Extra seconds of silence.', 3, 20) }, ['seconds']) },
    { name: 'highlight_locus', description: 'Highlight a place in the body on the visual (e.g. the nostril, the heart centre).', parameters: obj({ locus: loci.length ? STR('Body locus id.', { enum: loci }) : STR('Body locus id.'), seconds: INT('How long to keep it highlighted.', 2, 15) }, ['locus']) },
    { name: 'show_explainer', description: 'Show a short card about the practice: how to do it, why, safety, or sources.', parameters: obj({ card: STR('Which card.', { enum: ['how', 'why', 'safety', 'source'] }) }, ['card']) },
    { name: 'end_session', description: 'End the practice session when the person wants to finish.', parameters: obj({ reason: STR('Short reason.', { maxLength: 80 }) }) },
    { name: 'get_practice_context', description: 'Current practice, phase, round, level and safety limits. Call before moving the practice if unsure where it is.', parameters: obj({}) },
    { name: 'lookup_qa', description: 'Look up a reviewed answer for a question about this practice. Prefer it over answering from memory.', parameters: obj({ question: STR('The question in plain words.', { maxLength: 200 }) }, ['question']) },
  ]
}
function obj(properties, required = []) { return { type: 'object', properties, required, additionalProperties: false } }

export const toQwen = specs => specs.map(s => ({ type: 'function', function: { name: s.name, description: s.description, parameters: s.parameters } }))
export const toOpenAI = specs => specs.map(s => ({ type: 'function', name: s.name, description: s.description, parameters: s.parameters }))
export const qwenTools = o => toQwen(toolSpecs(o))
export const openaiTools = o => toOpenAI(toolSpecs(o))

const TO_BUS = { end_session: 'end' }

/** Minimal JSON-schema check for the subset used above. Returns null when valid, else a reason. */
export function validateArgs(schema, args) {
  if (args == null || typeof args !== 'object' || Array.isArray(args)) return 'arguments must be an object'
  for (const k of schema.required || []) if (!(k in args)) return `missing ${k}`
  for (const [k, v] of Object.entries(args)) {
    const p = schema.properties?.[k]
    if (!p) { if (schema.additionalProperties === false) return `unknown argument ${k}`; continue }
    if (p.type === 'integer' && !(Number.isInteger(v))) return `${k} must be an integer`
    if (p.type === 'string' && typeof v !== 'string') return `${k} must be a string`
    if (p.type === 'boolean' && typeof v !== 'boolean') return `${k} must be a boolean`
    if (p.enum && !p.enum.includes(v)) return `${k} must be one of ${p.enum.slice(0, 12).join(', ')}`
    if (p.minimum != null && v < p.minimum) return `${k} below ${p.minimum}`
    if (p.maximum != null && v > p.maximum) return `${k} above ${p.maximum}`
    if (p.maxLength != null && v.length > p.maxLength) return `${k} too long`
  }
  return null
}

/**
 * Run one model tool call. Returns the string to send back as function_call_output.
 * @param {object} bus      rt/bus.mjs
 * @param {string} name     tool name from the model
 * @param {string|object} rawArgs  JSON string (as delivered by response.function_call_arguments.done) or object
 * @param {object} [o]      { specs, qa: (question) → {answer, id}|null }
 */
export function dispatchTool(bus, name, rawArgs, { specs = null, qa = null } = {}) {
  const S = specs || toolSpecs({ timeline: null })
  const spec = S.find(s => s.name === name)
  let args = rawArgs
  if (typeof rawArgs === 'string') { try { args = rawArgs.trim() ? JSON.parse(rawArgs) : {} } catch { return out({ ok: false, reason: 'arguments_not_json' }) } }
  if (!spec) return out({ ok: false, reason: 'unknown_tool' })
  const bad = validateArgs(spec.parameters, args ?? {})
  if (bad) return out({ ok: false, reason: 'invalid_arguments', detail: bad })
  if (name === 'get_practice_context') return out({ ok: true, context: bus.context() })
  if (name === 'lookup_qa') {
    const hit = qa ? qa(args.question) : null
    return out(hit ? { ok: true, found: true, ...hit } : { ok: true, found: false })
  }
  const res = bus.exec(TO_BUS[name] || name, args || {}, { source: 'model' })
  return out(res)
}
function out(o) { return JSON.stringify(o) }
