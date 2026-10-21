// Satsang realtime layer · command bus (rt/README.md, specs/PRACTICE-ASK.md §v0.2).
// One place where every actor (the realtime model, the user's taps, the deterministic safety triage, the host) changes the player.
// The model is a conversational surface; the player state is the truth; the bus guards the boundary.
//
// SHARED CLOCK CONTRACT
//   - The only clock is the compiled timeline's time t (seconds), owned by the player and read through port.now().
//     Wall time is used only for the extend_pause timer and log stamps. At speed s, t advances s × wall seconds.
//   - Positions are addressed by phase address { id, round } (compile ≥ 0.3 breath entry ids), never by raw seconds from the model.
//   - The host calls bus.tick() every frame (or ≥ 10 Hz). tick() accrues the retention ledger, counts round starts, runs pending
//     jumps (replay returns, skipped rounds) and enforces "holds never slowed".
//   - A recompile (set_level) swaps the timeline; the bus re-indexes it and maps the position to the same round start.
//
// HARD GUARDS (apply to every source; 'safety' can only ever reduce load)
//   - Retention: played retention + retention still scheduled by a plan ≤ the session baseline (sum of holds in the timeline compiled
//     at session start). No hold is ever lengthened, replayed or slowed (speed is forced to 1 inside holds).
//   - Rounds: played round starts + scheduled round starts ≤ baseline rounds. repeat_round is rewritten to skip a later round when
//     needed, else refused.
//   - Intensity: set_level may go gentler any time; back to 'standard' only if the session started there and no safety event locked it.
//     Rounds may only go down. Speed never above 1 from the model.
//   - extend_pause: only inside a silence pause (phase 'rest', not a speaking window), ≤ 20 s per call, ≤ 40 s per pause, ≤ 120 s per session.
//   - speak: ≤ 60 words, and refused when it instructs longer holds, forcing, or a hold above the cap.
import { indexTimeline, projectLoad, HOLDS, SILENCE } from './timeline-index.mjs'

export const COMMANDS = ['play', 'pause', 'resume', 'seek_phase', 'replay_phase', 'repeat_round', 'set_level', 'extend_pause',
  'highlight_locus', 'show_explainer', 'speak', 'end']
export const INTERNAL = ['interrupt', 'release_hold', 'lock']          // host / safety only, never model tools
export const MODEL_ALLOWED = new Set(['pause', 'resume', 'seek_phase', 'replay_phase', 'repeat_round', 'set_level', 'extend_pause',
  'highlight_locus', 'show_explainer', 'speak', 'end'])
export const LIMITS = { slow: 0.75, min_speed: 0.6, extend_call_s: 20, extend_pause_s: 40, extend_session_s: 120, speak_words: 60, retention_slack_s: 0.25 }
const EPS = 1e-6
const r2 = x => Math.round(x * 100) / 100

export function createBus({ port, grammar = null, practice = null, clock = defaultClock(), limits = {} } = {}) {
  if (!port) throw new Error('createBus: port required (rt/player-port.mjs)')
  const L = { ...LIMITS, ...limits }
  let ix = indexTimeline(port.timeline())
  const tl0 = port.timeline()
  const baseline = {
    retention_s: ix.holdTotal, rounds: ix.rounds.length, max_hold_s: Math.min(tl0?.safety?.max_hold_s ?? 30, 30),
    beginner: !!tl0?.opts?.beginner, rounds_opt: tl0?.opts?.rounds ?? null,
  }
  const S = {
    played: { retention_s: 0, rounds: 0 }, prevT: null, jumps: [], slowUntil: null, speed: 1,
    level: baseline.beginner ? 'gentler' : 'standard', locked: null, resumeT: null, interruptedAt: null,
    extended: { session: 0, byEntry: {} }, holdTimer: null, holdToken: 0, ended: false,
  }
  const log = [], listeners = new Set()
  const emit = e => { for (const f of listeners) try { f(e) } catch { } }
  const now = () => port.now()
  const cur = () => ix.at(now())
  const budgetLeft = () => Math.max(0, baseline.retention_s - S.played.retention_s)

  // ---------- plans and the load guard ----------
  function pathFrom(t0, jumps) {
    const path = []; let c = t0
    for (const j of jumps) { path.push([c, j.at]); c = j.to }
    path.push([c, ix.total]); return path
  }
  function fits(t0, jumps, { ignoreRoundsIn = null } = {}) {
    const p = projectLoad(ix, pathFrom(t0, jumps))
    if (ignoreRoundsIn) p.rounds -= ix.roundsIn(ignoreRoundsIn[0], ignoreRoundsIn[1])
    if (S.locked) p.retention_s = 0                     // after a safety event every remaining hold is skipped (see tick)
    const ret = S.played.retention_s + p.retention_s, rounds = S.played.rounds + p.rounds
    const okRet = ret <= baseline.retention_s + L.retention_slack_s, okRounds = rounds <= baseline.rounds
    return { ok: okRet && okRounds, retention_s: r2(ret), rounds, why: !okRet ? 'retention_budget' : !okRounds ? 'round_budget' : null }
  }
  // landing exactly on a round start counts it on the next tick, unless countRound is false (a phase replay is not a new round)
  function seekTo(t, { countRound = true } = {}) { port.seek(t); S.prevT = countRound ? t - 1e-3 : t }
  function setSpeed(x) { S.speed = x; port.setSpeed(x) }

  // ---------- tick: the clock contract ----------
  function tick() {
    if (S.ended) return
    const t = now()
    if (S.prevT != null && t > S.prevT && t - S.prevT < 2) {
      S.played.retention_s += ix.holdsIn(Math.max(0, S.prevT), t)
      for (const r of ix.rounds) if (r.t > S.prevT && r.t <= t) { S.played.rounds++; emit({ type: 'round', round: r.round, t }) }
    }
    S.prevT = t
    let e = ix.at(t)
    if (e && HOLDS.has(e.phase) && S.locked && port.playing()) { seekTo(e.end); emit({ type: 'skip_hold', entry: brief(e) }); e = ix.at(e.end) }
    if (e && HOLDS.has(e.phase) && S.speed !== 1) setSpeed(1)                 // holds are never slowed (or sped)
    if (S.slowUntil != null && t >= S.slowUntil - EPS) { S.slowUntil = null; if (S.speed !== 1) setSpeed(1) }
    while (S.jumps.length && t >= S.jumps[0].at - EPS) {
      const j = S.jumps.shift(); seekTo(j.to); if (j.speed) setSpeed(j.speed); emit({ type: 'jump', from: j.at, to: j.to, why: j.why })
    }
    if (e && e !== S._lastEntry) { S._lastEntry = e; emit({ type: 'phase', entry: brief(e) }) }
  }

  // ---------- commands ----------
  const H = {
    play() { if (S.locked === 'stop' && this.source === 'model') return no('locked_after_safety'); port.duck(false); port.play(); S.resumeT = null; S.interruptedAt = null; S.holdToken++; return yes() },
    resume() { return H.play.call(this) },
    pause() {   // never freeze someone in retention: a hold is released to its out-breath first
      const e = cur(); let released = false
      if (e && HOLDS.has(e.phase)) { seekTo(e.end); released = true }
      port.pause(); S.resumeT = now(); return yes({ released, say: released ? 'Breathe out gently.' : null })
    },
    interrupt() {   // barge-in: duck narration, never leave someone frozen in a hold
      port.duck(true); const t = now(), e = ix.at(t)
      S.interruptedAt = e ? { id: e.id, round: e.round, i: e.i } : null
      let released = false
      if (e && HOLDS.has(e.phase)) { seekTo(e.end); released = true }
      port.pause(); S.resumeT = now()
      return yes({ released, say: released ? 'Breathe out gently.' : null })
    },
    release_hold() {
      const e = cur(); if (!e || !HOLDS.has(e.phase)) return yes({ released: false })
      seekTo(e.end); return yes({ released: true, say: 'Breathe out gently.' })
    },
    seek_phase({ phase, round, which } = {}) {
      const t = now(), e = cur()
      let target = null
      if (which && !phase) {
        const k = e ? e.i : 0
        target = which === 'next' ? ix.B[k + 1] : which === 'previous' ? ix.B[Math.max(0, k - 1)] : ix.B[k]
      } else if (phase) {
        const c = ix.find(phase); if (!c?.length) return no('unknown_phase', { known: ix.ids.slice(0, 40) })
        const r = round ?? e?.round ?? ix.roundAt(t)
        target = c.find(b => b.round === r) || c.find(b => b.t >= t) || c[c.length - 1]
      }
      if (!target) return no('no_target')
      if (HOLDS.has(target.phase) && target.t < t) return no('hold_not_replayable')
      const chk = fits(target.t, [])
      if (!chk.ok) return no(chk.why, chk)
      S.jumps = []; seekTo(target.t); return yes({ to: brief(target) })
    },
    replay_phase({ phase, round, slow = false } = {}) {
      const t = S.resumeT ?? now()
      let e
      if (phase) {
        const c = ix.find(phase); if (!c?.length) return no('unknown_phase', { known: ix.ids.slice(0, 40) })
        const r = round ?? ix.at(t)?.round
        e = c.filter(b => b.round === r && b.t <= t + EPS).pop() || c.filter(b => b.t <= t + EPS).pop() || c[0]
      } else {
        const s = S.interruptedAt ? ix.B[S.interruptedAt.i] : ix.at(t)
        e = s; if (e && HOLDS.has(e.phase)) e = ix.B[e.i - 1]          // a hold is never replayed: show the breath before it
        if (e && e.t >= t - EPS && e.i > 0 && !HOLDS.has(ix.B[e.i - 1].phase)) e = ix.B[e.i - 1]   // at a boundary: the phase just done
      }
      if (!e) return no('no_target')
      if (HOLDS.has(e.phase)) return no('hold_not_replayable')
      const back = Math.max(t, e.end)
      const jumps = back > e.end + EPS ? [{ at: e.end, to: back, speed: 1, why: 'replay_return' }] : []
      const chk = fits(e.t, jumps, { ignoreRoundsIn: [e.t, e.end] })
      if (!chk.ok) return no(chk.why, chk)
      const speed = slow ? Math.max(L.min_speed, Math.min(1, typeof slow === 'number' ? slow : L.slow)) : 1
      S.jumps = jumps
      if (port.replayPhase) { port.replayPhase(e, speed); S.prevT = e.t; S.speed = speed }   // play player: native slow replay (rate back to 1× at the phase end)
      else { seekTo(e.t, { countRound: false }); setSpeed(speed) }
      S.slowUntil = slow ? e.end : null
      port.duck(false); port.play(); S.resumeT = null; S.interruptedAt = null
      return yes({ phase: brief(e), speed, returns_to: r2(back) })
    },
    repeat_round({ round } = {}) {
      const t = now(), r = round ?? (ix.roundAt(t) || ix.rounds[ix.rounds.length - 1]?.round)
      const k = ix.rounds.findIndex(x => x.round === r)
      if (k < 0 && !ix.rounds.length && ix.holdTotal === 0) { S.jumps = []; seekTo(0); port.duck(false); port.play(); return yes({ round: null, note: 'started the play again from the beginning' }) }   // plays are meant to be repeated
      if (k < 0) return no('unknown_round', { rounds: ix.rounds.length })
      const R = ix.rounds[k]
      let jumps = [], note = null
      let chk = fits(R.t, jumps)
      if (!chk.ok && ix.rounds[k + 1]) {      // stay within the session: repeat this round, skip the next one
        const skipTo = ix.rounds[k + 2]?.t ?? ix.rounds[k + 1].end
        jumps = [{ at: R.end, to: skipTo, why: 'skip_round_to_stay_within_limits' }]
        chk = fits(R.t, jumps); note = `round ${ix.rounds[k + 1].round} will be skipped so the session stays within its limits`
      }
      if (!chk.ok) return no(chk.why, chk)
      S.jumps = jumps; seekTo(R.t); setSpeed(1); port.duck(false); port.play(); S.resumeT = null; S.interruptedAt = null
      return yes({ round: r, note })
    },
    set_level({ level, rounds } = {}) {
      const want = level === 'beginner' ? 'gentler' : level
      if (want && !['gentler', 'standard'].includes(want)) return no('unknown_level')
      if (want === 'standard') {
        if (baseline.beginner) return no('above_compiled_level')
        if (S.locked) return no('locked_after_safety')
      }
      const curTl = port.timeline()
      if (rounds != null && rounds > (curTl?.loops ?? 0)) return no('rounds_can_only_go_down')
      if (this.source === 'safety' && want === 'standard') return no('safety_only_reduces')
      const t = now(), r = ix.roundAt(t), e = ix.at(t)
      const opts = {}
      if (want) opts.beginner = want === 'gentler'
      if (rounds != null) opts.rounds = Math.max(1, rounds | 0)
      if (!Object.keys(opts).length) return no('nothing_to_change')
      const prev = port.timeline()
      if (port.setLevel(opts) === false) return no('not_supported_by_player')
      const nix = indexTimeline(port.timeline())
      // guard the new timeline from the mapped position (never more retention or rounds than the baseline)
      const nr = nix.rounds.find(x => x.round === r)
      const to = nr ? nr.t : Math.min(t, nix.total)
      const save = ix; ix = nix
      const chk = fits(to, [], { ignoreRoundsIn: nr && S.played.rounds ? [to, to + 1e-3] : null })   // restarting the current round in a new form is not a new round
      if (!chk.ok) { ix = save; port.setLevel({ beginner: !!prev?.opts?.beginner, rounds: prev?.loops }); return no(chk.why, chk) }
      S.jumps = []; seekTo(to, { countRound: !(nr && S.played.rounds) }); if (want) S.level = want
      return yes({ level: S.level, rounds: port.timeline()?.loops, from: e ? brief(e) : null, holds_left_s: r2(nix.holdsIn(to, nix.total)) })
    },
    extend_pause({ seconds } = {}) {
      const e = cur(); const s = Math.round(+seconds || 0)
      if (!(s > 0)) return no('bad_seconds')
      if (!e || !SILENCE.has(e.phase) || e.sub === 'speak') return no('not_a_silence_pause', { phase: e?.phase, sub: e?.sub })
      if (s > L.extend_call_s) return no('over_call_cap', { cap_s: L.extend_call_s })
      const key = `${e.id}@${e.round}`, used = S.extended.byEntry[key] || 0
      if (used + s > L.extend_pause_s) return no('over_pause_cap', { cap_s: L.extend_pause_s, used_s: used })
      if (S.extended.session + s > L.extend_session_s) return no('over_session_cap', { cap_s: L.extend_session_s, used_s: S.extended.session })
      S.extended.byEntry[key] = used + s; S.extended.session += s
      if (port.hold(s) === true) ix = indexTimeline(port.timeline())   // the player lengthened the pause itself (may recompile)
      else {            // fallback: pause the clock for s seconds, then resume unless something else happened
        const tok = ++S.holdToken; port.pause()
        clock.clearTimeout(S.holdTimer); S.holdTimer = clock.setTimeout(() => { if (tok === S.holdToken && !S.ended) port.play() }, s * 1000)
      }
      return yes({ seconds: s, session_used_s: S.extended.session })
    },
    highlight_locus({ locus, seconds = 6 } = {}) {
      const loci = grammar?.loci || {}
      const alias = Object.fromEntries(Object.entries(loci).flatMap(([id, l]) => (l.alias || []).map(a => [a, id])))
      const id = loci[locus] ? locus : alias[locus]
      if (!id) return no('unknown_locus', { known: Object.keys(loci).slice(0, 40) })
      const rendered = port.highlight(id, Math.max(2, Math.min(15, +seconds || 6))) === true
      return yes({ locus: id, rendered })
    },
    show_explainer({ topic = 'how', card } = {}) {
      const kind = card || (['how', 'why', 'safety', 'source'].includes(topic) ? topic : 'how')
      const body = explainer(practice, port.timeline(), kind)
      const rendered = port.showExplainer({ kind, topic, ...body }) === true
      return yes({ kind, title: body.title, rendered })
    },
    speak({ text } = {}) {
      const lint = lintSpeech(text, { max_hold_s: baseline.max_hold_s, words: L.speak_words })
      if (!lint.ok) return no(lint.why)
      port.speak(lint.text)
      return yes({ spoken: lint.text })
    },
    end({ reason } = {}) { S.ended = true; S.jumps = []; clock.clearTimeout(S.holdTimer); port.duck(false); port.stop(); return yes({ reason: reason || null }) },
    lock({ level = 'soften' } = {}) {
      if (this.source !== 'safety' && this.source !== 'system') return no('internal_only')
      S.locked = S.locked === 'stop' ? 'stop' : level
      baseline.retention_s = Math.min(baseline.retention_s, S.played.retention_s)   // no further holds this session
      return yes({ locked: S.locked })
    },
  }
  function yes(x = {}) { return { ok: true, ...x } }
  function no(reason, x = {}) { return { ok: false, reason, ...x } }

  function exec(cmd, args = {}, { source = 'system' } = {}) {
    let res
    if (!H[cmd]) res = no('unknown_command')
    else if (source === 'model' && !MODEL_ALLOWED.has(cmd)) res = no('not_allowed_for_model')
    else if (S.ended && cmd !== 'end') res = no('session_ended')
    else { try { res = H[cmd].call({ source }, args || {}) } catch (err) { res = no('error', { message: String(err?.message || err) }) } }
    res.cmd = cmd
    const entry = { at: r2(now()), wall: clock.now(), cmd, args, source, ok: res.ok, reason: res.reason || null }
    log.push(entry); emit({ type: 'command', ...entry, result: res })
    return res
  }

  function context() {
    const t = now(), e = ix.at(t), tl = port.timeline()
    return {
      practice: tl?.practice, name: tl?.name, t: r2(t), total_s: r2(ix.total), playing: port.playing(), level: S.level,
      phase: e ? brief(e) : null, round: ix.roundAt(t), rounds: ix.rounds.length,
      limits: { max_hold_s: baseline.max_hold_s, retention_left_s: r2(budgetLeft()), extend_left_s: L.extend_session_s - S.extended.session, locked: S.locked },
      phases: ix.ids.slice(0, 60),
    }
  }

  return {
    exec, tick, context, log, on(f) { listeners.add(f); return () => listeners.delete(f) },
    get state() { return { ...S, played: { ...S.played }, baseline: { ...baseline } } },
    get index() { return ix },
    rebind() { ix = indexTimeline(port.timeline()) },
  }
}

function brief(e) { return { id: e.id, phase: e.phase, sub: e.sub, nostril: e.nostril, round: e.round, t: r2(e.t), dur: r2(e.dur) } }

export function explainer(practice, tl, kind) {
  const p = practice || {}
  if (kind === 'safety') return { title: 'Safety', lines: [...(tl?.safety?.contraindications || p.contraindications || []).map(c => `Not if: ${c}`), ...(tl?.safety?.stop_if || []).map(s => `Stop if: ${s}`)] }
  if (kind === 'source') return { title: 'Sources', lines: (p.sources || []).map(s => s.label || s.title || s.url).filter(Boolean) }
  if (kind === 'why') return { title: 'Why it works this way', lines: [p.summary].filter(Boolean) }
  return { title: 'How', lines: (p.steps || []).map(s => typeof s === 'string' ? s : s.text || s.caption || '').filter(Boolean).slice(0, 8) }
}

// Speech lint for anything the bus speaks on the model's behalf (cached answers, model text). The model's own streamed audio is
// governed by its instructions and the tool guards; this catches the cases that pass through the bus.
export function lintSpeech(text, { max_hold_s = 30, words = 60 } = {}) {
  let s = String(text || '').replace(/\s+/g, ' ').trim()
  if (!s) return { ok: false, why: 'empty' }
  const low = s.toLowerCase()
  if (/\b(hold|retain|keep)\b[^.?!]{0,30}\b(longer|as long as (you )?can|until it hurts|max(imum)?)\b/.test(low)) return { ok: false, why: 'instructs_longer_holds' }
  if (/\b(push|force|strain)\s+(through|past|harder)\b|\bignore (the |any )?(dizziness|pain|discomfort)\b/.test(low)) return { ok: false, why: 'instructs_forcing' }
  for (const m of low.matchAll(/\bhold[^.?!]{0,25}?(\d{1,3})\s*(s\b|sec|second)/g)) if (+m[1] > max_hold_s) return { ok: false, why: 'hold_over_cap' }
  const w = s.split(' ')
  if (w.length > words) { const cut = w.slice(0, words).join(' '); const k = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! ')); s = k > 20 ? cut.slice(0, k + 1) : cut + '…' }
  return { ok: true, text: s }
}

function defaultClock() {
  return { now: () => Date.now(), setTimeout: (f, ms) => setTimeout(f, ms), clearTimeout: h => clearTimeout(h) }
}
