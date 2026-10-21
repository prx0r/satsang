// Satsang shared clock (engine milestone 1). Pure, no DOM, node-testable.
// One timeline time t drives everything: narration segments, pauses, breath animation, the sound wave, the rest timer.
// The host calls tick(dtReal) each frame and acts on the returned events (start a clip, show a caption, play a bell...).
//
// Rules (player/API.md "Clock rules"):
//  · t advances by dtReal × rate while playing.
//  · Gate: a voice entry with gate:true holds t at its speak_end until speechEnded(id); if the speech ends early, t jumps to
//    speak_end, so the pause always starts when the voice stops. No gate when the voice is off (opts.gate false).
//  · Live hold: holdLive(true) freezes t (a live line from the bus is speaking).
//  · Hold open: if the last segment has hold_open, reaching the end does not end the play; t rests at total and the rest
//    timer keeps counting until end() or rest_cap_s.
//  · rested_s: real seconds spent in silence (the pause part of a segment whose wave cue has flat_hold, plus the hold-open tail).
import { breathEvents } from '../body/breath.mjs'

export const CLOCK = 'satsang-clock/1'

export function segmentsOf(tl) {
  const M = (tl?.tracks?.markers || []).filter(m => m.kind === 'segment')
  const V = tl?.tracks?.voice || [], W = (tl?.tracks?.visual || []).filter(v => v.prim === 'wave')
  return M.map((m, i) => {
    const v = V.find(x => x.segment === m.id) || null
    const flat = W.some(w => w.segment === m.id && w.flat_hold)
    return { id: m.id, n: i + 1, of: M.length, t: m.t, speak_end: m.speak_end, end: m.end, hold_open: !!m.hold_open, voice: v, flat }
  })
}
export function segmentAt(segs, t) {
  let k = -1
  for (let i = 0; i < segs.length; i++) { if (segs[i].t <= t + 1e-9) k = i; else break }
  return k < 0 ? null : segs[k]
}

export function createClock(tl, opts = {}) {
  const S = {
    tl, segs: segmentsOf(tl), t: 0, playing: false, rate: 1, gate: opts.gate !== false, rest_cap_s: opts.rest_cap_s ?? 600,
    waiting: null,          // segment id whose speech the clock is waiting for
    speaking: new Set(),    // gated lines that started and have not ended
    done: new Set(),        // gated lines that ended (per pass)
    live: false, holdOpen: false, ended: false, fresh: true, rested_s: 0, lastRestTick: 0,
  }
  const total = () => S.tl.total_s
  const lastSeg = () => S.segs[S.segs.length - 1]
  const inSilence = t => {
    const s = segmentAt(S.segs, t)
    if (!s) return false
    if (S.holdOpen) return true
    return s.flat && t >= s.speak_end - 1e-9
  }

  function tick(dt) {
    const ev = []
    if (!S.playing || S.ended) return ev
    if (S.live) return ev
    const t0 = S.t, fresh = S.fresh; S.fresh = false
    if (S.holdOpen) {
      S.rested_s += dt
      restTick(ev)
      if (S.rested_s >= S.rest_cap_s) ev.push(...end('rest_cap'))
      return ev
    }
    let target = Math.min(total(), t0 + dt * S.rate)
    // gate: a started, unfinished gated line holds t at its speak_end
    if (S.gate) for (const s of S.segs) {
      if (!s.voice?.gate || !S.speaking.has(s.id)) continue
      if (t0 <= s.speak_end + 1e-9 && target >= s.speak_end) { target = s.speak_end; if (S.waiting !== s.id) { S.waiting = s.id; ev.push({ type: 'state', t: target, waiting: true, segment: s.id }) } }
    }
    const cross = x => (fresh ? x >= t0 - 1e-9 : x > t0 + 1e-9) && x <= target + 1e-9
    for (const s of S.segs) {
      if (cross(s.t)) {
        ev.push({ type: 'segment_started', t: s.t, id: s.id, n: s.n, of: s.of })
        if (s.voice) {
          ev.push({ type: 'speech_started', t: s.t, id: s.id, text: s.voice.text, say: s.voice.say, gate: !!s.voice.gate })
          if (s.voice.gate && S.gate && s.voice.say) { S.speaking.add(s.id); S.done.delete(s.id) }
        }
      }
      if (s.speak_end > s.t && cross(s.speak_end) && !(S.waiting === s.id)) {
        ev.push({ type: 'pause_started', t: s.speak_end, id: s.id, pause_s: Math.round((s.end - s.speak_end) * 1000) / 1000 })
        if (s.flat) ev.push({ type: 'silence_entered', t: s.speak_end, id: s.id })
      }
    }
    // non-segment voice entries (breath practices) become captions/speech requests too
    for (const v of S.tl.tracks.voice || []) if (!v.segment && cross(v.t)) ev.push({ type: 'speech_started', t: v.t, id: v.block || null, text: v.text, say: v.say, gate: false })
    for (const a of S.tl.tracks.audio || []) if (cross(a.t) && !(a.sound === 'bell-end' && lastSeg()?.hold_open)) ev.push({ type: 'audio', t: a.t, sound: a.sound })
    ev.push(...breathEvents(S.tl, fresh ? t0 - 1e-6 : t0, target))
    // rest timer (real seconds, only while not waiting on speech)
    if (!S.waiting && inSilence(target)) { S.rested_s += dt; restTick(ev) }
    S.t = target
    if (S.t >= total() - 1e-9) {
      if (lastSeg()?.hold_open) { S.holdOpen = true; ev.push({ type: 'state', t: S.t, hold_open: true }) }
      else ev.push(...end('complete'))
    }
    return ev
  }
  function restTick(ev) { if (S.rested_s - S.lastRestTick >= 5) { S.lastRestTick = Math.floor(S.rested_s / 5) * 5; ev.push({ type: 'rest_tick', t: S.t, rested_s: Math.round(S.rested_s) }) } }

  // the host reports that a gated line finished (or failed): release the gate, or catch up if it ended early
  function speechEnded(id) {
    const ev = []
    if (!S.speaking.has(id)) return ev
    S.speaking.delete(id); S.done.add(id)
    const s = S.segs.find(x => x.id === id)
    const early = s && S.t < s.speak_end - 1e-9 ? Math.round((s.speak_end - S.t) * 1000) / 1000 : 0
    if (s && S.t <= s.speak_end + 1e-9 && S.t >= s.t - 1e-9) {
      S.t = s.speak_end
      ev.push({ type: 'speech_ended', t: S.t, id, ...(early ? { early_s: early } : {}) })
      ev.push({ type: 'pause_started', t: S.t, id, pause_s: Math.round((s.end - s.speak_end) * 1000) / 1000 })
      if (s.flat) ev.push({ type: 'silence_entered', t: S.t, id })
    } else ev.push({ type: 'speech_ended', t: S.t, id })
    if (S.waiting === id) { S.waiting = null; ev.push({ type: 'state', t: S.t, waiting: false }) }
    return ev
  }
  function seek(t) {
    S.t = Math.max(0, Math.min(total(), t)); S.fresh = true; S.speaking.clear(); S.done.clear(); S.waiting = null
    S.holdOpen = false; S.ended = false
    return S.t
  }
  function end(reason = 'end') {
    if (S.ended) return []
    S.ended = true; S.playing = false; S.speaking.clear(); S.waiting = null
    return [{ type: 'ended', t: S.t, reason, rested_s: Math.round(S.rested_s), total_s: S.tl.total_s }]
  }
  // swap in a recompiled timeline (extend_pause, set_level) keeping t (the caller maps it); gate state is kept per segment id
  function setTimeline(tl2, t2 = S.t) { S.tl = tl2; S.segs = segmentsOf(tl2); S.t = Math.max(0, Math.min(tl2.total_s, t2)) }

  return {
    tick, speechEnded, seek, end, setTimeline,
    play() { if (S.ended) { seek(0); S.rested_s = 0; S.lastRestTick = 0 } S.playing = true },
    pause() { S.playing = false },
    reset() { seek(0); S.rested_s = 0; S.lastRestTick = 0; S.playing = false },
    holdLive(on) { S.live = !!on },
    setRate(r) { S.rate = Math.max(0.25, Math.min(2, r)) },
    setGate(on) { S.gate = !!on; if (!on) { S.speaking.clear(); S.waiting = null } },
    get t() { return S.t }, get playing() { return S.playing }, get waiting() { return S.waiting }, get ended() { return S.ended },
    get rate() { return S.rate }, get rested_s() { return S.rested_s }, get holdOpen() { return S.holdOpen }, get live() { return S.live },
    get segments() { return S.segs }, get timeline() { return S.tl },
    segment() { return segmentAt(S.segs, S.t) },
    silence() { return inSilence(S.t) },
  }
}
