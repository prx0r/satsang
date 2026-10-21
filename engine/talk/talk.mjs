// Satsang /talk/ mock page: the real player + bus + safety + adapter, with the scripted fake model as the "server".
import { compile } from '../compile.mjs'
import { createPlayer } from '../player/player.js'
import { portFromPlayer } from '../rt/player-port.mjs'
import { createTalkFlow } from './flow.mjs'
import { SCRIPTS } from '../rt/safety.mjs'
const FIXED = new Set(Object.values(SCRIPTS).flatMap(v => typeof v === 'string' ? [v] : Object.values(v)))

const $ = s => document.querySelector(s)
const base = new URL('../', import.meta.url)
const getJSON = p => fetch(new URL(p, base)).then(r => { if (!r.ok) throw new Error(p + ' ' + r.status); return r.json() })
const [grammar, practice] = await Promise.all([getJSON('grammar.json'), getJSON('practices/nadi-shodhana-sivananda.json')])

// ---- voices: practice narration (player) and the guide (model + safety lines), both on speechSynthesis ----
let guideOn = true
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null
const utter = (text, o = {}) => new Promise(res => {
  if (!synth) return res()
  const u = new SpeechSynthesisUtterance(text); u.rate = o.rate || 0.92; u.pitch = o.pitch || 1; u.onend = res; u.onerror = res; synth.speak(u)
})
window.SatsangTTS = { speak: t => utter(t, { rate: 0.86 }), cancel() { try { synth?.cancel() } catch { } } }
function guideSay(text, kind = 'guide') {
  const b = $('#bubble'); b.classList.toggle('safety', kind === 'safety')
  b.innerHTML = `<small>${kind === 'safety' ? 'Safety (fixed wording)' : 'Guide'}</small><span></span>`; b.querySelector('span').textContent = text
  if (guideOn) { try { synth?.cancel() } catch { } return utter(text, { rate: 0.95, pitch: 1.05 }) }
}

// ---- player + port ----
const player = createPlayer($('#stage'), { grammar, compile, practice, options: { voice: false } })
const port = portFromPlayer(player, {
  onExplainer: c => showCard(c),
  onHighlight: (l, s) => log(`highlight ${l} (${s}s): player highlight API pending`, 'bus'),
})
let lastSafety = null
port.speak = text => guideSay(text, FIXED.has(text) ? 'safety' : 'guide')
function showCard(c) {
  const el = $('#card'); el.querySelector('h3').textContent = c.title || 'About'
  el.querySelector('ul').innerHTML = ''; for (const l of (c.lines || []).slice(0, 6)) { const li = document.createElement('li'); li.textContent = l; el.querySelector('ul').appendChild(li) }
  el.style.display = 'block'; clearTimeout(showCard.t); showCard.t = setTimeout(() => (el.style.display = 'none'), 9000)
}

// ---- paced event queue so the fake model feels like a network peer ----
const queue = []; let pumping = false
const schedule = f => { queue.push(f); if (!pumping) pump() }
function pump() { pumping = true; const f = queue.shift(); if (!f) { pumping = false; return } f(); setTimeout(pump, queue.length > 40 ? 8 : 45) }

// ---- log ----
const logEl = $('#log')
function log(text, cls = '') { const d = document.createElement('div'); d.className = cls; d.textContent = `${player.state.t.toFixed(1).padStart(5)}s  ${text}`; logEl.prepend(d); while (logEl.childNodes.length > 200) logEl.lastChild.remove() }
function onEvent(e) {
  if (e.dir === 'safety') { lastSafety = e.say; log(`SAFETY ${e.class}/${e.intent}: handled before the model`, 'safety') }
  else if (e.dir === 'tool') { const o = JSON.parse(e.output); log(`tool ${e.name}(${e.arguments}) → ${o.ok ? 'ok' : 'refused: ' + o.reason}`, o.ok ? 'tool' : 'refused') }
  else if (e.dir === 'model' && e.type === 'text.done') log(`guide: ${e.text}`, 'model')
  else if (e.dir === 'local') log(`local command: ${e.cmd}`, 'tool')
  else if (e.dir === 'bus' && e.type === 'command' && e.source !== 'model') log(`bus ${e.source}: ${e.cmd}${e.ok ? '' : ' ✗ ' + e.reason}`, 'bus')
  else if (e.dir === 'bus' && e.type === 'jump') log(`bus: return ${e.from.toFixed(1)} → ${e.to.toFixed(1)} (${e.why})`, 'bus')
  else if (e.dir === 'bus' && e.type === 'skip_hold') log('bus: hold skipped (after a safety event)', 'bus')
  else if (e.dir === 'out' && ['input_audio_buffer.commit', 'response.create', 'response.cancel', 'conversation.item.create'].includes(e.type)) log(`→ ${e.type}`, '')
  else if (e.dir === 'in' && ['input_audio_buffer.speech_started', 'response.function_call_arguments.done', 'session.updated'].includes(e.type)) log(`← ${e.type}`, '')
}

let flow = await createTalkFlow({ port, practice, grammar, schedule, onEvent, speakModel: t => guideSay(t) })
;(function frame() { flow.bus.tick(); paint(); requestAnimationFrame(frame) })()
function paint() {
  const c = flow.bus.context(), st = flow.client.stats
  const P = { in: 'breathe in', out: 'breathe out', hold_in: 'hold', hold_out: 'hold out', natural: 'natural', rest: 'rest' }
  $('#s-phase').textContent = c.phase ? `${P[c.phase.phase] || c.phase.phase}${c.phase.nostril ? ' ' + c.phase.nostril : ''}` : '–'
  $('#s-round').textContent = c.round ? `${c.round} / ${c.rounds}` : '–'
  $('#s-speed').textContent = (player.timeline && flow.bus.state.speed) + '×'
  $('#s-level').textContent = c.level + (c.limits.locked ? ' · locked' : '')
  $('#s-turns').textContent = st.modelTurns; $('#s-tools').textContent = st.toolCalls; $('#s-ref').textContent = st.refused; $('#s-safe').textContent = st.safetyHits
}

// ---- talking ----
const talkBtn = $('#talk')
let pressed = false
function press() { if (pressed) return; pressed = true; talkBtn.classList.add('on'); talkBtn.textContent = 'Listening… release to send'; ensureStarted(); flow.talkStart(); if (rec) try { rec.start() } catch { } }
function release(text) {
  if (!pressed) return; pressed = false; talkBtn.classList.remove('on'); talkBtn.textContent = 'Hold to talk'
  if (rec && text == null) { try { rec.stop() } catch { } return }      // the recogniser's result calls send()
  send(text ?? $('#q').value)
}
function send(text) { text = (text || '').trim(); if (!text) return; log(`you: “${text}”`, ''); const r = flow.say(text); if (r.routed === 'model') log('→ sent to the model (no safety words found)', ''); $('#q').value = '' }
talkBtn.addEventListener('pointerdown', e => { e.preventDefault(); press() })
talkBtn.addEventListener('pointerup', () => release()); talkBtn.addEventListener('pointerleave', () => pressed && release())
window.addEventListener('keydown', e => { if (e.code === 'KeyT' && !e.repeat && document.activeElement !== $('#q')) press() })
window.addEventListener('keyup', e => { if (e.code === 'KeyT' && document.activeElement !== $('#q')) release() })
// Web Speech (if the browser has it) gives the local transcript; otherwise type or use the chips
const SR = window.SpeechRecognition || window.webkitSpeechRecognition
const rec = SR ? Object.assign(new SR(), { lang: 'en-GB', interimResults: false, maxAlternatives: 1 }) : null
if (rec) { rec.onresult = e => send(e.results[0][0].transcript); rec.onerror = () => { } }
$('#f').addEventListener('submit', e => { e.preventDefault(); ensureStarted(); flow.talkStart(); setTimeout(() => send($('#q').value), 250) })

const CHIPS = [['Slower please', ''], ['Show me again', ''], ['Can I hold longer?', ''], ['How does this work?', ''], ['Make it gentler', ''], ['Continue', ''],
  ['I feel dizzy', 'safety'], ['My hands are tingling', 'safety'], ['My chest hurts', 'safety']]
for (const [t, cls] of CHIPS) {
  const b = document.createElement('button'); b.className = 'chip ' + cls; b.textContent = t
  b.onclick = () => { ensureStarted(); flow.talkStart(); setTimeout(() => send(t), 300) }
  $('#chips').appendChild(b)
}
$('#gvoice').onclick = e => { guideOn = !guideOn; e.target.textContent = `Guide voice: ${guideOn ? 'on' : 'off'}`; e.target.setAttribute('aria-pressed', String(guideOn)) }
function ensureStarted() { if (!player.state.playing && player.state.t === 0) player.start() }

// ---- scripted demo ----
const wait = ms => new Promise(r => setTimeout(r, ms))
let demoRun = 0
async function demo() {
  const my = ++demoRun
  await restart()
  log('— demo: practising, about to talk over the guide mid-hold —', 'tool')
  player.start(); player.seek(18)
  await wait(2500); if (my !== demoRun) return
  log('— you press talk (barge-in) —', 'tool'); flow.talkStart()
  await wait(900); if (my !== demoRun) return
  send('Slower please')
  await wait(12000); if (my !== demoRun) return
  log('— you ask for a longer hold —', 'tool'); flow.talkStart(); await wait(600); send('Can I hold it longer?')
  await wait(6000); if (my !== demoRun) return
  flow.bus.exec('resume', {}, { source: 'user' }); await wait(3000); if (my !== demoRun) return
  log('— you feel dizzy —', 'tool'); flow.talkStart(); await wait(700); send('I feel dizzy')
  await wait(9000); if (my !== demoRun) return
  log('— demo done: “Continue” resumes the gentle form (no holds) —', 'tool')
}
async function restart() {
  queue.length = 0; try { synth?.cancel() } catch { }
  player.pause(); player.set({ beginner: false, speed: 1 }); player.seek(0)
  flow.client.close()
  flow = await createTalkFlow({ port, practice, grammar, schedule, onEvent, speakModel: t => guideSay(t) })
  lastSafety = null; logEl.innerHTML = ''; $('#bubble').classList.remove('safety')
}
$('#demo').onclick = demo
$('#reset').onclick = () => { demoRun++; restart() }
if (new URLSearchParams(location.search).get('demo') === '1') demo()
window.__talk = { get flow() { return flow }, player }
