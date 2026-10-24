// Curator safety triage: deterministic, runs on the user's words BEFORE retrieval or any model. No network, < 1 ms.
// Symptom rules and negation are ported from engine/rt/safety.mjs (satsang-triage/1, the practice-time triage); the curator adds
// a crisis class (self-harm), a spiritual/mental-health emergency class, an "intense practice requested" flag and condition
// filters. Wording is fixed here (one reviewable place). English only in v0.
//
// classes (most severe wins):
//   crisis      thoughts of suicide or self-harm                     -> no pack; crisis wording only
//   emergency   chest pain, fainting, cannot breathe, stroke, seizure -> no pack; seek medical help now
//   unsettled   hearing voices, losing touch, kundalini/spiritual emergency, days without sleep, dissociation
//                                                                    -> gentle grounding pack only + see a professional
//   stop        dizzy, tingling, panic, racing heart, breathless...  -> stop any practice now; gentle pack, no breath work
//   soften      anxious, stressed, overwhelmed, can't hold           -> gentle pack: no holds, no intense or esoteric practice
//   none
// flags (independent of class):
//   intense     asked for breath retention / forceful breathing / raising kundalini -> never prescribed; orientation only
//   conditions  pregnancy, high blood pressure, heart condition, epilepsy, glaucoma, asthma, recent surgery, trauma
//               -> practices whose cautions name the condition are dropped; no breath-focused practice for heart/BP/pregnancy

export const SAFETY_VERSION = 'satsang-curator-triage/1 (rules from satsang-triage/1)'
const R = (s) => new RegExp(s, 'i')

const RULES = [
  // ---- crisis ----
  ['crisis', 'self_harm', R(String.raw`\bsuicid\w*|\bkill(ing)? myself\b|\bend (my|it all|my own) li(fe|ves)\b|\bend it all\b|\bwant(ing)? to die\b|\bdon'?t want to (live|be alive|exist)\b|\bself[- ]?harm\w*|\bhurt(ing)? myself\b|\bcut(ting)? myself\b|\bno (reason|point) (to|in) (live|living|going on)\b|\bbetter off dead\b|\btake my (own )?life\b`)],
  // ---- emergency (engine/rt/safety.mjs) ----
  ['emergency', 'chest_pain', R(String.raw`\bchest\b[^.?!]{0,20}\b(pain|hurts?|hurting|ache|aching|tight(ness)?|pressure|squeez\w*|crush\w*)|\b(pain|pressure|tightness)\s+in\s+(my\s+)?chest\b|\bheart attack\b|\bmy heart (hurts|is hurting)\b`)],
  ['emergency', 'left_arm', R(String.raw`\b(left|my)\s+arm\b[^.?!]{0,15}\b(pain|hurts?|numb\w*|heavy)\b|\b(pain|numbness)\s+(in|down)\s+(my\s+)?left arm\b`)],
  ['emergency', 'fainted', R(String.raw`\b(fainted|passed out|blacked out|blacking out|lost consciousness|going to (faint|pass out)|about to (faint|pass out)|gonna (faint|pass out))\b`)],
  ['emergency', 'cannot_breathe', R(String.raw`\b(can'?t|cannot|can not|unable to|couldn'?t)\s+(breathe|get (any )?air)\b|\bchok(e|ing)\b|\bsuffocat\w*\b|\bthroat (is )?closing\b`)],
  ['emergency', 'stroke_signs', R(String.raw`\b(one|left|right) side of (my )?(face|body)\b[^.?!]{0,20}\b(numb\w*|weak\w*|droop\w*|dead)\b|\bface\b[^.?!]{0,10}\bdroop\w*|\bslurr\w*\b|\bworst headache\b|\bsudden(ly)? (severe|terrible) headache\b|\bcan'?t (move|feel) my (arm|leg|face)\b`)],
  ['emergency', 'seizure', R(String.raw`\bseizure\b|\bconvuls\w*`)],
  // ---- unsettled (spiritual or mental-health emergency) ----
  ['unsettled', 'psychosis', R(String.raw`\bhearing voices\b|\bvoices (in my head|telling me)\b|\bseeing things (that|which) (aren'?t|are not) there\b|\blos(ing|t) (touch with reality|my mind)\b|\bpsychos[ie]s?\b|\bpsychotic\b|\bparanoi\w*`)],
  ['unsettled', 'spiritual_emergency', R(String.raw`\bspiritual (emergency|crisis)\b|\bkundalini (syndrome|crisis|awakening (went|gone|is going) wrong|is out of control|won'?t stop)\b|\bdark night\b[^.?!]{0,30}\b(can'?t cope|unbearable|scared)\b|\benergy (won'?t stop|out of control)\b|\b(haven'?t|have not|can'?t|cannot) slept? (for|in) (days|\d+ (days|nights))\b|\bdepersonali[sz]\w*|\bderealis\w*|\bderealiz\w*|\bdissociat\w*\b[^.?!]{0,20}\b(all the time|constantly|scared|can'?t)\b`)],
  // ---- stop (engine/rt/safety.mjs) ----
  ['stop', 'dizzy', R(String.raw`\bdizz\w*|\blight[\s-]?headed\w*|\bhead\s*(is\s*)?(spinning|swimming)\b|\bvertigo\b|\b(feel|feeling|bit|little|so)\s+faint\b|\bwoozy\b`)],
  ['stop', 'tingling', R(String.raw`\btingl\w*|\bpins and needles\b|\bnumb(ness)?\b[^.?!]{0,15}\b(hands?|fingers?|lips?|face|feet|mouth)\b`)],
  ['stop', 'vision', R(String.raw`\b(blurr(y|ed)|double|tunnel)\s+vision\b|\bseeing (spots|stars|flashes)\b`)],
  ['stop', 'panic', R(String.raw`\bpanic attacks?\b|\bpanicking\b|\bfreaking out\b|\banxiety attack\b|\bcan'?t calm down\b`)],
  ['stop', 'heart_racing', R(String.raw`\bheart\b[^.?!]{0,12}\b(racing|pounding|fluttering|skipping|irregular|beating (so )?fast)\b|\bpalpitation\w*`)],
  ['stop', 'breathless', R(String.raw`\b(breathless|out of breath|short of breath|shortness of breath|gasping|air hunger|hyperventilating)\b`)],
  // ---- soften ----
  ['soften', 'anxious', R(String.raw`\banxious\b|\banxiety\b|\bpanic\b|\bstress(ed|ful)?\b|\bworr(y|ied|ying)\b|\boverwhelm\w*|\buneasy\b|\bnervous\b|\bagitated\b|\bon edge\b|\bcan'?t sleep\b|\binsomnia\b|\bburn(ed|t)? out\b|\bburnout\b`)],
  ['soften', 'grief', R(String.raw`\bgriev\w*|\bgrief\b|\bbereave\w*|\bmourning\b|\blost my (mum|mom|mother|dad|father|wife|husband|partner|son|daughter|child|baby|friend|brother|sister)\b|\bpassed away\b|\bdied (last|this|recently)\b`)],
  ['soften', 'trauma', R(String.raw`\btrauma\w*|\bptsd\b|\babuse[d]?\b`)],
]
const SEVERITY = { none: 0, soften: 1, stop: 2, unsettled: 3, emergency: 4, crisis: 5 }
const NEG = /\b(no|not|don'?t|doesn'?t|didn'?t|never|without|isn'?t|aren'?t|wasn'?t|nor)\b/
const CLAUSE = /\b(but|and|so|though|although|yet|however)\b|[,;]/

const INTENSE = R(String.raw`\bbreath[- ]?hold\w*|\bhold(ing)? (my|the|your) breath\b|\bretention\b|\bkumbhaka\b|\bwim hof\b|\btummo\b|\bkapalabhati\b|\bbhastrika\b|\bbreath of fire\b|\bhyperventilat\w*|\bholotropic\b|\brebirthing breath\w*|\b(raise|raising|awaken|awakening|activate|activating|open|opening) (my |the )?kundalini\b|\bkundalini (awakening|activation|raising)\b|\bbandhas?\b|\bkhecari\b|\bintense pranayama\b|\badvanced pranayama\b|\bdmt\b|\bastral projection\b|\bout[- ]of[- ]body\b`)
const CONDITIONS = {
  pregnancy: [R(String.raw`\bpregnan\w*|\bexpecting a baby\b`), /pregnan/i],
  hypertension: [R(String.raw`\bhigh blood pressure\b|\bhypertensi\w*`), /blood pressure|hypertension/i],
  heart_condition: [R(String.raw`\bheart (condition|disease|problem|issues?)\b|\bpacemaker\b|\barrhythmia\b`), /heart/i],
  epilepsy: [R(String.raw`\bepilep\w*`), /epilep|seizure/i],
  glaucoma: [R(String.raw`\bglaucoma\b|\bdetached retina\b`), /glaucoma|retina|eye pressure/i],
  asthma: [R(String.raw`\basthma\w*|\bcopd\b`), /asthma|copd/i],
  recent_surgery: [R(String.raw`\b(recent|just had)\s+(an\s+)?(surgery|operation)\b`), /surgery|operation/i],
  mental_health: [R(String.raw`\bbipolar\b|\bschizo\w*|\bdepress(ion|ed)\b|\bmental health\b|\bptsd\b|\btrauma\w*`), /mental[- ]health|trauma|psychiatric|crisis|depress/i],
}

export const LINES = {
  crisis: "I'm really sorry you're carrying this. Please reach out to someone now: call your local emergency number, or a crisis line (in the UK and Ireland, Samaritans on 116 123; in the US, call or text 988; elsewhere, findahelpline.com lists free lines). If you can, tell someone near you how you feel. Satsang's talks and practices will still be here; right now, talking to a person matters more.",
  emergency: 'Please stop any practice and get medical help now: call your local emergency number if you have chest pain, trouble breathing, fainting, weakness on one side or a seizure. This is not something to meditate through.',
  unsettled: "What you describe deserves care from a person, not a programme: please talk to a doctor or a mental-health professional, and if you have a teacher, tell them too. Intense practice can make this worse, so for now Satsang only suggests gentle, grounding things: walking, kindness, time outdoors, ordinary routine.",
  stop: 'If this is happening now, stop any practice, breathe normally and rest; if it does not settle, or comes with chest pain or fainting, get medical help. The path below keeps to gentle practice with no breath work.',
  soften: 'This path keeps things gentle: short sits, no breath holds, nothing intense. If what you feel is strong or lasting, please also talk to a doctor or counsellor; practice is a support, not a treatment.',
  grief: 'Go gently: grief is not a problem to fix. The path below is short and kind; skip any day you need to, and lean on the people around you.',
  intense: "Satsang doesn't prescribe breath retention, forceful breathing or practices meant to raise kundalini: they are traditionally taught in person, with a teacher who can see how you respond. Where they appear below, they are orientation only (what it is and where it is taught), with gentle practice to do in the meantime.",
  esoteric: 'Practices about past lives, the bardo and tantric or ritual methods are shown as orientation: what the tradition says and where it is taught. They are traditionally learned from a teacher, and no particular experience or result is promised.',
  conditions: (list) => `Because you mentioned ${list}, practices whose cautions name it are left out, and breath work stays gentle. Check with your doctor before starting anything new.`,
}

function normalise(t) { return String(t || '').toLowerCase().replace(/[\u2018\u2019\u02bc]/g, "'").replace(/\s+/g, ' ').trim() }
function negated(s, idx) {
  const before = s.slice(Math.max(0, idx - 60), idx), parts = before.split(CLAUSE), tail = parts[parts.length - 1] || ''
  return NEG.test(tail.trim().split(' ').filter(Boolean).slice(-3).join(' '))
}

export function triage(text) {
  const s = normalise(text)
  let best = { class: 'none', intent: null }
  for (const [cls, intent, re] of RULES) {
    const m = re.exec(s); if (!m) continue
    if (negated(s, m.index)) continue // the curator only ever acts on positive statements ("not anxious" does nothing)
    if (SEVERITY[cls] > SEVERITY[best.class]) best = { class: cls, intent }
  }
  const im = INTENSE.exec(s), intense = !!im && !negated(s, im.index)
  const conditions = Object.entries(CONDITIONS).filter(([, [re]]) => { const m = re.exec(s); return m && !negated(s, m.index) }).map(([k]) => k)
  const block = best.class === 'crisis' || best.class === 'emergency'
  const gentle = SEVERITY[best.class] >= SEVERITY.soften || conditions.includes('mental_health')
  const notes = []
  if (best.class === 'crisis') notes.push(LINES.crisis)
  else if (best.class === 'emergency') notes.push(LINES.emergency)
  else if (best.class === 'unsettled') notes.push(LINES.unsettled)
  else if (best.class === 'stop') notes.push(LINES.stop)
  else if (best.class === 'soften') notes.push(best.intent === 'grief' ? LINES.grief : LINES.soften)
  if (intense && !block) notes.push(LINES.intense)
  if (conditions.length && !block) notes.push(LINES.conditions(conditions.map((c) => c.replace(/_/g, ' ').replace('hypertension', 'high blood pressure')).join(', ')))
  return { class: best.class, intent: best.intent, block, gentle, groundingOnly: best.class === 'unsettled', noBreathWork: best.class === 'stop' || conditions.some((c) => ['pregnancy', 'hypertension', 'heart_condition', 'asthma', 'epilepsy', 'glaucoma'].includes(c)),
    intense, conditions, notes, version: SAFETY_VERSION }
}

// Does a practice's own caution text name one of the disclosed conditions?
export function practiceExcluded(p, conditions) {
  const c = (p.caut || []).join(' ')
  return conditions.some((k) => CONDITIONS[k]?.[1].test(c))
}
