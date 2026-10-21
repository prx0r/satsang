// Satsang realtime layer · player ports. The bus talks to a player only through this small interface:
//   now() → t · playing() → bool · timeline() → compiled timeline · play() · pause() · stop() · seek(t) · setSpeed(x)
//   setLevel({beginner?, rounds?}) (recompiles) · duck(on) (narration down/paused while someone speaks)
//   hold(s) → true if the player can freeze its clock for s seconds itself (else the bus pauses + resumes)
//   highlight(locus, s) → true if rendered · showExplainer({kind,title,lines}) → true if rendered · speak(text) (narration channel)
//
// portFromPlay(p) adapts the play player (player/play.js, commands in player/API.md). portFor(p) picks the right one.
// portFromPlayer(p) adapts the older Canvas2D player (player/player.js), feature-detecting newer methods and stubbing what is missing:
//   duck → p.duck(on) | else cancel narration on duck · hold → p.hold(s) | p.extendPause(s) · highlight → p.highlight(locus, s) |
//   p.highlightLocus · showExplainer → p.showExplainer(card) | p.showCard(card) · stop → p.stop() | p.end() | pause+seek(end)
//   setSpeed → p.setSpeed(x) | p.set({speed}) · setLevel → p.setLevel(o) | p.set(o) · seek → p.seek(t)
// createSimPort() is a headless player with the same interface: tests, the node mock flow and offline checks.

export function portFromPlayer(p, { tts = null, onExplainer = null, onHighlight = null } = {}) {
  const has = k => typeof p?.[k] === 'function'
  const narr = () => tts || (typeof window !== 'undefined' && window.SatsangTTS) || null
  return {
    kind: 'engine-player',
    now: () => p.state.t,
    playing: () => !!p.state.playing,
    timeline: () => p.timeline,
    play: () => (has('resume') && p.state.t > 0 ? p.resume() : p.play()),
    pause: () => p.pause(),
    stop: () => (has('stop') ? p.stop() : has('end') ? p.end() : (p.pause(), p.seek(p.timeline.total_s))),
    seek: t => p.seek(t),
    setSpeed: x => (has('setSpeed') ? p.setSpeed(x) : p.set({ speed: x })),
    setLevel: o => (has('setLevel') ? p.setLevel(o) : p.set(o)),
    duck: on => { if (has('duck')) return p.duck(on); if (on) try { narr()?.cancel?.() } catch { } },
    hold: s => (has('hold') ? p.hold(s) !== false : has('extendPause') ? p.extendPause(s) !== false : false),
    highlight: (l, s) => (has('highlight') ? p.highlight(l, s) !== false : has('highlightLocus') ? p.highlightLocus(l, s) !== false : (onHighlight?.(l, s), !!onHighlight)),
    showExplainer: c => (has('showExplainer') ? p.showExplainer(c) !== false : has('showCard') ? p.showCard(c) !== false : (onExplainer?.(c), !!onExplainer)),
    speak: text => { if (has('say')) return p.say(text); const n = narr(); if (n?.speak) return n.speak(text) },
    missing: ['duck', 'hold', 'highlight', 'showExplainer', 'stop'].filter(k => !has(k) && !(k === 'highlight' && has('highlightLocus')) && !(k === 'showExplainer' && has('showCard')) && !(k === 'stop' && has('end'))),
  }
}

/**
 * Adapt the play player (player/play.js, API in player/API.md, engine milestone 1). Its commands take phase ids, so seek(t) maps t to
 * the breath entry starting there (never into the middle of a hold: then the next phase). Rate exists only inside replay_phase, so
 * replayPhase is native and setSpeed is a no-op. set_level maps gentler → 'first-steps', standard → the level the session began at.
 */
export function portFromPlay(p, { onHighlight = null } = {}) {
  const startLevel = p.state.level || 'steady'
  const tl = () => p.timeline
  function entryFor(t) {
    const B = tl().tracks.breath
    let k = -1; for (let i = 0; i < B.length; i++) { if (B[i].t <= t + 1e-3) k = i; else break }
    let e = B[k]; if (!e) return B[0]
    if ((e.phase === 'hold_in' || e.phase === 'hold_out') && t > e.t + 1e-3) e = B[k + 1] || e
    while (e && !e.id && k > 0) e = B[--k]
    return e
  }
  return {
    kind: 'play-player',
    now: () => p.state.t, playing: () => !!p.state.playing, timeline: tl,
    play: () => (p.state.t > 0 && !p.state.ended ? p.resume() : p.play()),
    pause: () => p.pause(),
    stop: () => p.end({ reason: 'bus' }),
    seek(t) { if (t >= tl().total_s - 1e-3) return p.end({ reason: 'seek_end' }); const e = entryFor(t); if (e) p.seek_phase(e.id, { round: e.round || undefined }) },
    setSpeed: () => false,
    replayPhase: (e, speed) => p.replay_phase(e.id, { slow: speed, round: e.round || undefined }),
    setLevel(o) { if (o.rounds != null) return false; if ('beginner' in o) return p.set_level(o.beginner ? 'first-steps' : startLevel).ok !== false; return false },
    duck: () => { },                                   // pause() already stops the voice
    hold: s => p.extend_pause(s).ok === true,
    highlight: (l, s) => p.highlight_locus(l, { seconds: s }).ok === true,
    showExplainer: c => p.show_explainer({ title: c.title, text: (c.lines || []).join(' · '), seconds: 10, pause: false }).ok === true,
    speak: text => p.speak(text, { gate: true, interrupt: true }),
    missing: ['setSpeed (rate only via replay_phase)', 'rounds'],
  }
}

/** Pick the right port for a player object. */
export function portFor(p, o) { return typeof p?.seek_phase === 'function' && typeof p?.dispatch === 'function' ? portFromPlay(p, o) : portFromPlayer(p, o) }

/** Headless player: a deterministic clock over a compiled timeline. advance(dt) moves wall time; the bus ticks via onTick. */
export function createSimPort({ compile, grammar, practice, opts = {} }) {
  const st = { t: 0, playing: false, speed: 1, ducked: false, opts: { ...opts }, tl: null, ended: false, held: 0 }
  const calls = []
  const rec = (k, a) => calls.push([k, a])
  const recompile = () => { st.tl = compile(practice, grammar, st.opts) }
  recompile()
  const port = {
    kind: 'sim',
    now: () => st.t, playing: () => st.playing, timeline: () => st.tl,
    play() { rec('play'); st.playing = true; st.ended = false },
    pause() { rec('pause'); st.playing = false },
    stop() { rec('stop'); st.playing = false; st.ended = true },
    seek(t) { rec('seek', t); st.t = Math.max(0, Math.min(st.tl.total_s, t)) },
    setSpeed(x) { rec('speed', x); st.speed = x },
    setLevel(o) { rec('level', o); Object.assign(st.opts, o); if (o.rounds == null && 'beginner' in o) delete st.opts.rounds; recompile() },
    duck(on) { rec('duck', on); st.ducked = !!on },
    hold(s) { rec('hold', s); st.held += s; return true },
    highlight(l, s) { rec('highlight', [l, s]); return true },
    showExplainer(c) { rec('explainer', c.kind); return true },
    speak(text) { rec('speak', text) },
    missing: [],
  }
  return {
    port, st, calls,
    /** advance wall time by dt seconds in small steps, calling tick() after each step (like rAF) */
    advance(dt, tick, step = 0.05) {
      for (let w = 0; w < dt - 1e-9; w += step) {
        const d = Math.min(step, dt - w)
        if (st.held > 0) { st.held = Math.max(0, st.held - d) }
        else if (st.playing) { st.t = Math.min(st.tl.total_s, st.t + d * st.speed); if (st.t >= st.tl.total_s) st.playing = false }
        tick?.()
      }
    },
  }
}
