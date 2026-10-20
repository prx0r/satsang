// Intentions (specs/FORYOU.md §2): what the listener brings, optional and private. A curated chip set (goals, current
// issues, curiosities), each mapped to topics, plus a free-text "what's on your mind" matched by keywords (no model).
// Intentions bias For You and the Topic flash's topic choice. They never go stale: full weight for 14 days, then they fade
// (half-life 7 days) and Your model asks "Still on your mind?". Stored on the device (wiser.intentions) and synced
// anonymously through PUT /intentions; part of Download my data and Delete everything.

export const INTENT_GROUPS = [
  ['goals', 'Goals'], ['issues', 'Going through'], ['curious', 'Curious about'],
]
export const INTENTS = [
  { id: 'start-meditating', g: 'goals', label: 'Start meditating', topics: { 'meditation/guided': 1, 'meditation/breath': 1, meditation: 0.8, mindfulness: 0.7 } },
  { id: 'deeper-practice', g: 'goals', label: 'Go deeper in practice', topics: { jhana: 1, meditation: 0.7, 'meditation/dzogchen': 0.6, 'meditation/silent-illumination': 0.6 } },
  { id: 'sleep', g: 'goals', label: 'Sleep', topics: { 'meditation/guided': 1, 'meditation/breath': 0.9, thought: 0.5, 'emotions/fear': 0.4 } },
  { id: 'kinder', g: 'goals', label: 'Be kinder', topics: { kindness: 1, 'kindness/compassion': 1, relationships: 0.6 } },
  { id: 'devotion', g: 'goals', label: 'Devotion', topics: { 'faith/bhakti': 1, faith: 0.8, 'meditation/prayer': 0.8, 'faith/grace': 0.7, divine: 0.5 } },
  { id: 'awakening', g: 'goals', label: 'Awakening', topics: { awakening: 1, 'self/self-enquiry': 0.7, 'right-view': 0.6 } },
  { id: 'grief', g: 'issues', label: 'Grief', topics: { death: 1, impermanence: 1, 'emotions/sadness': 1, kindness: 0.6 } },
  { id: 'anxiety', g: 'issues', label: 'Anxiety', topics: { 'emotions/fear': 1, mindfulness: 0.9, 'meditation/breath': 0.9, emotions: 0.7, thought: 0.6 } },
  { id: 'anger', g: 'issues', label: 'Anger', topics: { 'emotions/anger': 1, kindness: 0.7, 'kindness/compassion': 0.6, emotions: 0.6 } },
  { id: 'relationships', g: 'issues', label: 'Relationships', topics: { relationships: 1, kindness: 0.7, 'daily-life': 0.6 } },
  { id: 'craving', g: 'issues', label: 'Habits and craving', topics: { craving: 1, 'craving/sensuality': 0.8, 'sense-restraint': 0.8, renunciation: 0.6 } },
  { id: 'restless', g: 'issues', label: 'Restlessness', topics: { 'emotions/boredom': 1, defilements: 0.8, thought: 0.6 } },
  { id: 'illness', g: 'issues', label: 'Illness and ageing', topics: { impermanence: 1, dukkha: 1, death: 0.8 } },
  { id: 'meaning', g: 'curious', label: 'The meaning of life', topics: { dukkha: 0.8, awakening: 0.8, self: 0.7, reality: 0.6, divine: 0.6 } },
  { id: 'rebirth', g: 'curious', label: 'Rebirth', topics: { rebirth: 1, kamma: 0.9, 'death/bardo': 0.8, 'rebirth/western': 0.8, soul: 0.7 } },
  { id: 'consciousness', g: 'curious', label: 'Consciousness', topics: { consciousness: 1, 'consciousness/states': 0.9, self: 0.6 } },
  { id: 'divine', g: 'curious', label: 'God and the divine', topics: { divine: 1, 'divine/the-one': 0.9, gnosis: 0.8, 'divine/goddess': 0.6 } },
  { id: 'nonduality', g: 'curious', label: 'Non-duality', topics: { 'reality/nonduality': 1, 'self/self-enquiry': 0.9, 'self/emptiness': 0.8, 'reality/maya': 0.7 } },
  { id: 'tantra', g: 'curious', label: 'Tantra and energy', topics: { 'texts/tantra': 1, 'meditation/kundalini': 1, 'divine/goddess': 0.7 } },
  { id: 'texts', g: 'curious', label: 'The old texts', topics: { texts: 1, 'right-view': 0.5 } },
]
const BY = Object.fromEntries(INTENTS.map((x) => [x.id, x]))
// keyword -> intention (free text). Word starts, lower case, no model.
const KEYWORDS = [
  [/\b(grie|griev|mourn|bereave|loss|lost (my|a|our)|passed away|died|funeral)/, 'grief'],
  [/\b(anxi|worr|panic|stress|nervous|afraid|fear|overwhelm)/, 'anxiety'],
  [/\b(ang(er|ry)|rage|resent|irritat|furious|hatred|hate)/, 'anger'],
  [/\b(sleep|insomni|can'?t rest|awake at night)/, 'sleep'],
  [/\b(lonel|partner|marri|husband|wife|family|friend|relationship|divorc|break ?up|parent|child)/, 'relationships'],
  [/\b(addict|crav|habit|porn|alcohol|drink|smok|scroll|phone|desire|lust|compuls)/, 'craving'],
  [/\b(bored|restless|distract|can'?t focus|focus)/, 'restless'],
  [/\b(sick|ill(ness)?\b|cancer|ageing|aging|old age|pain|dying|diagnos)/, 'illness'],
  [/\b(meaning|purpose|point of (it|life)|why am i|what am i doing|lost in life)/, 'meaning'],
  [/\b(rebirth|reincarn|afterlife|after death|past li(fe|ves)|karma|kamma|samsara|bardo)/, 'rebirth'],
  [/\b(conscious|awareness|the mind\b|hard problem)/, 'consciousness'],
  [/\b(god|divine|christ|jesus|allah|the one\b|prayer|pray)/, 'divine'],
  [/\b(non-?dual|advaita|oneness|who am i|the self\b|ego|no self|not-self|emptiness)/, 'nonduality'],
  [/\b(tantra|kundalini|chakra|energy|shakti|shiva|goddess)/, 'tantra'],
  [/\b(meditat|beginner|start(ing)? (to )?sit|how to sit|breath)/, 'start-meditating'],
  [/\b(jhana|retreat|deeper|samadhi|absorption)/, 'deeper-practice'],
  [/\b(kind|compassion|metta|forgiv|loving)/, 'kinder'],
  [/\b(devotion|bhakti|worship|surrender|grace|faith)/, 'devotion'],
  [/\b(enlighten|awaken|liberat|nirvana|nibbana|moksha|realis|realiz)/, 'awakening'],
  [/\b(sutta|sutra|gita|upanishad|scripture|text|bible|gospel)/, 'texts'],
]
export function matchText(s) {
  const t = String(s || '').toLowerCase().slice(0, 400), ids = []
  for (const [re, id] of KEYWORDS) if (re.test(t) && !ids.includes(id)) ids.push(id)
  return ids.slice(0, 4)
}
export const FULL_DAYS = 14, HALF_LIFE = 7
export const weightAt = (at, now = Date.now()) => { const d = (now - Date.parse(at || 0)) / 86400000; if (!(d >= 0)) return 1; return d <= FULL_DAYS ? 1 : Math.pow(0.5, (d - FULL_DAYS) / HALF_LIFE) }

export function createIntentions(d) {
  // d: { esc, LS, api, apiOn(), device(), toast, onChange() }
  const { esc, LS } = d
  const read = () => { const o = LS.get('intentions', null); return o && typeof o === 'object' && Array.isArray(o.items) ? o : { items: [], text: null, updated: null } }
  const write = (o) => { o.updated = new Date().toISOString(); LS.set('intentions', o); push(o); d.onChange?.() }
  let pT = null
  const push = (o) => { if (!d.apiOn()) return; clearTimeout(pT); pT = setTimeout(() => d.api('/intentions', { method: 'PUT', body: { device: d.device(), data: o } }).catch(() => {}), 1500) }
  // active intentions with their current weight (for the feed and the flash): [{id, label, w, topics}]
  function active(now = Date.now()) {
    const o = read(), out = []
    for (const it of o.items) { const x = BY[it.id]; const w = weightAt(it.at, now); if (x && w >= 0.15) out.push({ id: x.id, label: x.label, w, topics: x.topics }) }
    if (o.text?.ids?.length) { const w = weightAt(o.text.at, now); if (w >= 0.15) for (const id of o.text.ids) if (BY[id] && !out.some((x) => x.id === id)) out.push({ id, label: BY[id].label, w: 0.8 * w, topics: BY[id].topics }) }
    return out
  }
  const stale = (now = Date.now()) => { const o = read(); return [...o.items.map((x) => x.at), o.text?.ids?.length ? o.text.at : null].filter(Boolean).some((at) => (now - Date.parse(at)) / 86400000 > FULL_DAYS) }
  const has = (id) => read().items.some((x) => x.id === id)
  function toggle(id) { const o = read(); if (has(id)) o.items = o.items.filter((x) => x.id !== id); else if (BY[id]) o.items.push({ id, at: new Date().toISOString() }); write(o) }
  function setText(v) { const o = read(), s = String(v || '').trim().slice(0, 400); o.text = s ? { v: s, ids: matchText(s), at: new Date().toISOString() } : null; write(o); return o.text }
  function refresh() { const o = read(), at = new Date().toISOString(); o.items = o.items.map((x) => ({ ...x, at })); if (o.text) o.text.at = at; write(o) }
  function letGo() { const o = read(), now = Date.now(); o.items = o.items.filter((x) => (now - Date.parse(x.at)) / 86400000 <= FULL_DAYS); if (o.text && (now - Date.parse(o.text.at)) / 86400000 > FULL_DAYS) o.text = null; write(o) }
  function clear() { LS.set('intentions', { items: [], text: null, updated: new Date().toISOString() }); push(read()); d.onChange?.() }
  // remote copy from /profile/sync: newest wins
  function merge(remote) { if (!remote || !Array.isArray(remote.items)) return; const l = read(); if (!l.updated || String(remote.updated || '') > String(l.updated)) { LS.set('intentions', { items: remote.items.filter((x) => BY[x.id]), text: remote.text || null, updated: remote.updated }); d.onChange?.() } else if (String(l.updated) > String(remote.updated || '')) push(l) }
  // the Your model section
  function section() {
    const o = read(), act = active(), st = stale()
    const chip = (x) => `<button type="button" class="wchip${has(x.id) ? ' tp on' : ''}" data-int="${esc(x.id)}" aria-pressed="${has(x.id)}">${esc(x.label)}</button>`
    return `<section class="wsec int-sec" id="intents"><div class="wsech"><h3>What you bring</h3><span class="muted small">Optional \u00b7 private</span></div>
      <p class="wsubs">Anything on your mind? For You and the Topic flash lean towards it for about two weeks, then ask again.</p>
      ${st ? `<div class="int-stale"><p>Still on your mind? ${esc(act.map((x) => x.label).join(', ') || 'What you picked a while ago')}</p><p class="fl-acts" style="justify-content:flex-start"><button type="button" class="hbtn" data-int-keep="1">Yes, keep it</button><button type="button" class="hbtn" data-int-go="1">Let it go</button></p></div>` : ''}
      ${INTENT_GROUPS.map(([g, l]) => `<p class="eyebrow int-g">${esc(l)}</p><div class="wtopics">${INTENTS.filter((x) => x.g === g).map(chip).join('')}</div>`).join('')}
      <form class="int-form" data-int-form="1"><label class="eyebrow int-g" for="int-text">What\u2019s on your mind?</label>
        <div class="int-row"><input id="int-text" class="int-in" type="text" maxlength="400" autocomplete="off" placeholder="A few words: \u201cmy father died\u201d, \u201cI can\u2019t sleep\u201d, \u201cis there rebirth?\u201d" value="${esc(o.text?.v || '')}"><button type="submit" class="hbtn">Save</button></div>
        <p class="muted small int-m">${o.text?.ids?.length ? 'Leaning towards: ' + esc(o.text.ids.map((id) => BY[id]?.label).join(' \u00b7 ')) : o.text ? 'Nothing matched yet; the chips above work best.' : 'Matched by keywords on this device. Never shared.'}</p></form>
      ${act.length || o.text ? `<p class="muted small"><button type="button" class="linkbtn" data-int-clear="1">Clear all</button></p>` : ''}</section>`
  }
  function bind(el, repaint) {
    el.querySelectorAll('[data-int]').forEach((b) => b.addEventListener('click', () => { toggle(b.dataset.int); repaint() }))
    el.querySelector('[data-int-form]')?.addEventListener('submit', (e) => { e.preventDefault(); const t = setText(el.querySelector('#int-text')?.value); d.toast(t?.ids?.length ? 'Noted. For You leans that way now.' : t ? 'Saved. Nothing matched yet.' : 'Cleared.'); repaint() })
    el.querySelector('[data-int-keep]')?.addEventListener('click', () => { refresh(); d.toast('Kept for two more weeks.'); repaint() })
    el.querySelector('[data-int-go]')?.addEventListener('click', () => { letGo(); repaint() })
    el.querySelector('[data-int-clear]')?.addEventListener('click', () => { clear(); repaint() })
  }
  return { read, active, stale, has, toggle, setText, refresh, letGo, clear, merge, section, bind }
}
