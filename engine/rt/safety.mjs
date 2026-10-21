// Satsang realtime layer · deterministic symptom triage (specs/PRACTICE-ASK.md flow step 3).
// Runs on the user's words BEFORE any model call: no network, no model, well under 1 ms. A hit never reaches the model;
// the session is ended or softened with fixed, pre-written wording (reviewable here, one place). English only in v0.
//
// classes (most severe wins):
//   emergency  chest pain, fainting/blacking out, cannot breathe, stroke signs, seizure      → end, seek medical help
//   stop       dizzy/lightheaded, tingling/numb hands or lips, vision changes, nausea, panic,
//              racing heart, breathless, headache                                             → release hold, pause, gentler, lock
//   soften     anxious, can't hold / straining, too intense                                    → release hold, gentler (no holds), lock
//   caution    pregnancy, high blood pressure, heart condition, glaucoma, epilepsy, asthma...  → if the practice lists it: end;
//                                                                                                  else if it has holds: gentler
//   check      an emergency word that was negated ("no chest pain")                          → pause and say the check line
// Negation: "not / no / don't / never / without / isn't" within three words before the match (stopping at but/and/so)
// turns stop/soften/caution into none and emergency into check.

export const SAFETY_VERSION = 'satsang-triage/1'

const R = (s) => new RegExp(s, 'i')
// order matters inside a class only for the reported intent; severity decides the class.
const RULES = [
  // ---- emergency ----
  ['emergency', 'chest_pain', R(String.raw`\bchest\b[^.?!]{0,20}\b(pain|hurts?|hurting|ache|aching|tight(ness)?|pressure|squeez\w*|crush\w*)|\b(pain|pressure|tightness)\s+in\s+(my\s+)?chest\b|\bheart attack\b|\bmy heart (hurts|is hurting)\b`)],
  ['emergency', 'left_arm', R(String.raw`\b(left|my)\s+arm\b[^.?!]{0,15}\b(pain|hurts?|numb\w*|heavy)\b|\b(pain|numbness)\s+(in|down)\s+(my\s+)?left arm\b`)],
  ['emergency', 'fainted', R(String.raw`\b(fainted|passed out|blacked out|blacking out|black(ing)? out|lost consciousness|going to (faint|pass out)|about to (faint|pass out)|gonna (faint|pass out))\b`)],
  ['emergency', 'cannot_breathe', R(String.raw`\b(can'?t|cannot|can not|unable to|couldn'?t)\s+(breathe|get (any )?air|catch a breath at all)\b|\bchok(e|ing)\b|\bsuffocat\w*\b|\bthroat (is )?closing\b`)],
  ['emergency', 'stroke_signs', R(String.raw`\b(one|left|right) side of (my )?(face|body)\b[^.?!]{0,20}\b(numb\w*|weak\w*|droop\w*|dead)\b|\bface\b[^.?!]{0,10}\bdroop\w*|\bslurr\w*\b|\bcan'?t (speak|talk) (properly|clearly)\b|\bworst headache\b|\bsudden(ly)? (severe|terrible) headache\b|\bcan'?t (move|feel) my (arm|leg|face)\b`)],
  ['emergency', 'seizure', R(String.raw`\bseizure\b|\bconvuls\w*|\bfitting\b`)],
  // ---- stop ----
  ['stop', 'dizzy', R(String.raw`\bdizz\w*|\blight[\s-]?headed\w*|\bhead\s*(is\s*)?(spinning|swimming)\b|\broom (is )?spinning\b|\bvertigo\b|\b(feel|feeling|bit|little|so)\s+faint\b|\bwoozy\b|\bgiddy\b|\bunsteady\b`)],
  ['stop', 'tingling', R(String.raw`\btingl\w*|\bpins and needles\b|\bnumb(ness)?\b[^.?!]{0,15}\b(hands?|fingers?|lips?|face|feet|mouth)\b|\b(hands?|fingers?|lips?|face|feet|mouth)\b[^.?!]{0,12}\b(numb|tingly|tingling|cramp\w*)\b`)],
  ['stop', 'vision', R(String.raw`\b(blurr(y|ed)|double|tunnel)\s+vision\b|\bvision\b[^.?!]{0,15}\b(blurr\w*|dark\w*|grey|gray|going|weird|spots)\b|\bseeing (spots|stars|flashes)\b|\bcan'?t see (properly|clearly)\b`)],
  ['stop', 'nausea', R(String.raw`\bnause\w*|\b(feel|feeling) (sick|queasy)\b|\bqueasy\b|\b(going to|gonna|might) (be sick|throw up|vomit)\b|\bvomit\w*`)],
  ['stop', 'panic', R(String.raw`\bpanic\w*|\bfreaking out\b|\bterrified\b|\banxiety attack\b|\bcan'?t calm down\b|\bi'?m (so )?scared\b|\bsomething'?s (really )?wrong\b`)],
  ['stop', 'heart_racing', R(String.raw`\bheart\b[^.?!]{0,12}\b(racing|pounding|fluttering|skipping|irregular|beating (so )?fast|going (so )?fast)\b|\bpalpitation\w*`)],
  ['stop', 'breathless', R(String.raw`\b(breathless|out of breath|short of breath|shortness of breath|gasping|air hunger|hyperventilat\w*)\b|\bcan'?t catch my breath\b`)],
  ['stop', 'headache', R(String.raw`\bheadache\b|\bhead (hurts|is pounding|is throbbing)\b|\bpounding head\b|\bpressure in my head\b`)],
  // ---- soften ----
  ['soften', 'anxious', R(String.raw`\banxious\b|\banxiety\b|\buneasy\b|\bnervous\b|\bagitated\b|\bon edge\b`)],
  ['soften', 'cant_hold', R(String.raw`\b(can'?t|cannot|struggl\w* to|hard to)\s+hold\b|\b(holds?|retention) (is|are|feels?) (too )?(long|hard|much)\b|\bstrain\w*\b|\btoo (intense|much|hard|long)\b|\bgasp\b`)],
  // ---- caution (contraindication disclosures) ----
  ['caution', 'pregnancy', R(String.raw`\bpregnan\w*|\bexpecting a baby\b|\bweeks pregnant\b`)],
  ['caution', 'hypertension', R(String.raw`\bhigh blood pressure\b|\bhypertension\b|\bhypertensive\b`)],
  ['caution', 'heart_condition', R(String.raw`\bheart (condition|disease|problem|issues?)\b|\bpacemaker\b|\barrhythmia\b|\bhad a heart attack\b`)],
  ['caution', 'glaucoma', R(String.raw`\bglaucoma\b|\bdetached retina\b`)],
  ['caution', 'epilepsy', R(String.raw`\bepilep\w*`)],
  ['caution', 'asthma', R(String.raw`\basthma\w*|\bcopd\b`)],
  ['caution', 'recent_surgery', R(String.raw`\b(recent|just had)\s+(an\s+)?(surgery|operation)\b`)],
]
const SEVERITY = { none: 0, caution: 1, soften: 2, check: 3, stop: 4, emergency: 5 }
const NEG = /\b(no|not|don'?t|doesn'?t|didn'?t|never|without|isn'?t|aren'?t|wasn'?t|nor|any)\b/
const CLAUSE = /\b(but|and|so|though|although|yet|however)\b|[,;]/

// Fixed wording. Plain, calm, no diagnosis. Reviewed copy lives here only.
export const SCRIPTS = {
  emergency: 'Please stop the practice now and breathe normally. If you have chest pain, trouble breathing, or you fainted, call your local emergency number or get medical help right away.',
  check: "Let's pause here. If you have any chest pain, trouble breathing, or feel faint, stop and get medical help. Otherwise, rest and breathe normally.",
  stop: {
    dizzy: "Let's stop the holds. Breathe normally through both nostrils. Sit or lie down until it passes. We'll only continue gently, if you want to.",
    tingling: "Let's stop here. Tingling can come from breathing harder than you need. Let the breath go back to normal, soft and slow, through the nose.",
    vision: "Let's stop the practice. Breathe normally and rest with your eyes closed. If your vision doesn't settle soon, get medical help.",
    nausea: "Let's stop here. Breathe normally and sit comfortably. Sip some water when you're ready.",
    panic: "You're safe. Let's stop the practice. Feel your feet and your seat. Let the breath be slow and easy, nothing to do now.",
    heart_racing: "Let's stop the holds and the practice. Breathe normally and rest. If your heart keeps racing or you feel unwell, get medical help.",
    breathless: "Let's stop. Breathe normally, in and out through the nose if you can. No counting now.",
    headache: "Let's stop the holds. Breathe normally and rest. If the headache is strong or sudden, get medical help.",
  },
  soften: {
    anxious: "Let's make it gentler. No holds now. Just smooth breathing in and out, with a slightly longer out-breath.",
    cant_hold: "That's fine. Let's make it gentler: no holds, just smooth breathing in and out.",
  },
  caution_end: "With that, this practice isn't one to do on your own. Let's stop here, and please check with your doctor or a qualified teacher first.",
  caution_soften: "With that, let's skip the holds. Keep the breath easy and smooth, and check with your doctor before practising with holds.",
}

function normalise(text) {
  return String(text || '').toLowerCase().replace(/[\u2018\u2019\u02bc]/g, "'").replace(/\s+/g, ' ').trim()
}
function negated(s, idx) {
  const before = s.slice(Math.max(0, idx - 60), idx)
  const parts = before.split(CLAUSE); const tail = parts[parts.length - 1] || ''
  const words = tail.trim().split(' ').filter(Boolean).slice(-3).join(' ')
  return NEG.test(words)
}

/**
 * @param {string} text  what the user said (local transcript)
 * @param {object} [ctx] { practice, timeline } to decide caution outcomes
 * @returns {{class, intent, matched, say, actions: Array<[cmd, args]>, model: boolean, version}}
 */
export function triage(text, ctx = {}) {
  const s = normalise(text)
  let best = { class: 'none', intent: null, matched: null }
  if (s) for (const [cls, intent, re] of RULES) {
    const m = re.exec(s); if (!m) continue
    let c = cls
    if (negated(s, m.index)) c = cls === 'emergency' ? 'check' : 'none'
    if (SEVERITY[c] > SEVERITY[best.class]) best = { class: c, intent, matched: m[0] }
  }
  return { ...best, ...plan(best, ctx), version: SAFETY_VERSION }
}

function plan({ class: c, intent }, { practice, timeline } = {}) {
  if (c === 'none') return { say: null, actions: [], model: true }
  if (c === 'emergency') return { say: SCRIPTS.emergency, actions: [['release_hold'], ['end', { reason: `safety:${intent}` }]], model: false, log: true }
  if (c === 'check') return { say: SCRIPTS.check, actions: [['interrupt'], ['lock', { level: 'stop' }]], model: false, log: true }
  if (c === 'stop') return { say: SCRIPTS.stop[intent] || SCRIPTS.stop.dizzy, actions: [['interrupt'], ['lock', { level: 'stop' }], ['set_level', { level: 'gentler' }]], model: false, log: true }
  if (c === 'soften') return { say: SCRIPTS.soften[intent] || SCRIPTS.soften.cant_hold, actions: [['release_hold'], ['lock', { level: 'soften' }], ['set_level', { level: 'gentler' }]], model: false, log: true, resume: true }
  // caution: does the practice itself list this condition?
  const contra = [...(practice?.contraindications || []), ...(practice?.safety?.contraindications || []), ...(timeline?.safety?.contraindications || [])].join(' ').toLowerCase()
  const KEY = { pregnancy: /pregnan/, hypertension: /hypertension|blood pressure/, heart_condition: /heart/, glaucoma: /glaucoma|retina/, epilepsy: /epilep/, asthma: /asthma|copd/, recent_surgery: /surgery|operation/ }
  const listed = KEY[intent]?.test(contra)
  const holds = (timeline?.tracks?.breath || []).some(b => b.phase === 'hold_in' || b.phase === 'hold_out')
  if (listed && !holds) return { say: SCRIPTS.caution_end, actions: [['interrupt'], ['end', { reason: `contraindicated:${intent}` }]], model: false, log: true }
  if (listed || holds) return { say: SCRIPTS.caution_soften, actions: [['release_hold'], ['lock', { level: 'soften' }], ['set_level', { level: 'gentler' }]], model: false, log: true, resume: true }
  return { say: null, actions: [], model: true, note: 'disclosed condition not listed for this practice; model may answer' }
}

/**
 * Apply a triage result to the bus: run its actions with source 'safety', then speak the fixed line.
 * Returns the bus results. A practice whose gentler form is not available (no beginner override) still had its holds released and locked.
 */
export function applyTriage(bus, res, { speak = true } = {}) {
  const out = []
  for (const [cmd, args] of res.actions) out.push(bus.exec(cmd, args || {}, { source: 'safety' }))
  if (speak && res.say) out.push(bus.exec('speak', { text: res.say }, { source: 'safety' }))
  if (res.resume) out.push(bus.exec('resume', {}, { source: 'safety' }))
  return out
}

// Deterministic local commands that never need the model ("pause", "stop", "carry on").
export function localCommand(text) {
  const s = normalise(text).replace(/[.!?]+$/, '')
  if (/^(pause|wait|hold on|one moment|just a (sec|second|moment))( please)?$/.test(s)) return ['pause']
  if (/^(stop|end|finish|that'?s enough|end (the )?(session|practice)|stop (the )?(session|practice))( please| now)?$/.test(s)) return ['end', { reason: 'user' }]
  if (/^(resume|continue|carry on|go on|keep going|ok(ay)? continue)( please)?$/.test(s)) return ['resume']
  return null
}
