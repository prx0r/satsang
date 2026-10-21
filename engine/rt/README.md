# Satsang realtime voice control layer (engine/rt)

Talk while you practise: the person speaks over the guide, the practice pauses safely, a realtime model answers and moves the
player through guarded tools. Spec: `../../specs/PRACTICE-ASK.md` (v0.2 realtime layer). Mock: `../talk/` (no key).

```
rt/
  bus.mjs             command bus + shared clock contract + hard guards (the only way anything changes the player)
  timeline-index.mjs  phase addresses {id, round}, rounds, retention/round load projection over a compiled timeline (compile ≥ 0.3)
  player-port.mjs     ports: portFromPlay (player/play.js, API.md) · portFromPlayer (player/player.js) · portFor · createSimPort (headless)
  safety.mjs          deterministic symptom triage BEFORE any model call + fixed wording + applyTriage + local commands
  tools.mjs           tool declarations in Qwen Omni Realtime and OpenAI Realtime shapes, argument validation, dispatchTool
  prompt.mjs          system instructions grounded in the practice JSON (+ approved QAs)
  qwen-adapter.mjs    realtime client (relay WebSocket): barge-in, tool round trip, audio playback; PCM player + mic capture
  relay-worker/       Cloudflare Worker relay (key in a secret binding; origin check, rate limit, event filter, caps). NOT DEPLOYED.
  test-rt.mjs         node rt/test-rt.mjs (bus, guards, safety, tool shapes, adapter protocol, relay policy)
```

## Commands
`play, pause, resume, seek_phase, replay_phase(slow?), repeat_round, set_level, extend_pause, highlight_locus, show_explainer, speak, end`
plus internal `interrupt` (barge-in), `release_hold`, `lock` (safety/host only). `bus.exec(cmd, args, { source })` with source
`model | user | safety | system` returns `{ ok, reason?, ... }`; every call is logged (`bus.log`) and emitted (`bus.on`).
Model tools (tools.mjs) = pause, resume, seek_phase, replay_phase, repeat_round, set_level, extend_pause, highlight_locus,
show_explainer, end_session, get_practice_context, lookup_qa. `play` and `speak` are not model tools (the model speaks itself).

## Shared clock contract
- One clock: the compiled timeline's `t` (seconds), owned by the player, read through `port.now()`. At rate r, t advances r × wall.
- Positions are phase addresses `{ id, round }` (breath ids from compile 0.3, segment ids for plays). The model never sends raw seconds.
- The host calls `bus.tick()` every frame (≥ 10 Hz): it accrues the retention ledger, counts round starts, runs pending jumps
  (the return after a replay, a skipped round) and forces rate 1 inside holds.
- Recompiles (set_level, the play player's extend_pause) swap the timeline; the bus re-indexes and keeps the place (same round start).
- Gates (VBT voice gates, live speech) are the player's business; the bus sees the same t.

## Hard guards (all sources; safety can only reduce)
| Guard | Rule |
|---|---|
| Retention | played + scheduled retention ≤ the session baseline (sum of holds compiled at start); holds are never replayed, slowed, or lengthened; a pause/interrupt mid-hold releases to the out-breath |
| Rounds | played + scheduled round starts ≤ baseline; repeat_round skips a later round to stay within, else refused |
| Intensity | gentler any time; standard only if the session began there and no safety lock; rounds only down; model speed never > 1 |
| extend_pause | only inside a silence pause (phase `rest`, not a speaking window): ≤ 20 s/call, ≤ 40 s/pause, ≤ 120 s/session |
| speak | ≤ 60 words; refused if it instructs longer holds, forcing, or a hold above the cap |
| After safety | `lock`: no more holds this session (skipped live), model cannot resume after a stop-class event, no way back to standard |

## Safety triage (safety.mjs)
emergency (chest pain, left arm, fainting/blacking out, can't breathe, stroke signs, seizure) → end + seek medical help ·
stop (dizzy, tingling/numb hands or lips, vision, nausea, panic, racing heart, breathless, headache) → release hold, pause, gentler, lock ·
soften (anxious, can't hold, too intense) → gentler + lock, carry on · caution (pregnancy, hypertension, heart condition, glaucoma,
epilepsy, asthma, surgery) → end if the practice lists it and has no holds to drop, else gentler · negated emergency words → a check line.
English only in v0. A hit never reaches the model. < 1 ms per utterance.

## Realtime topology
Browser mic (PCM16 16 kHz) → `wss://<relay>/realtime` (relay-worker; Origin allowlist, Workers Rate Limiting, event allowlist, caps,
Bearer key from secret `DASHSCOPE_API_KEY`) → `wss://{WORKSPACE_ID}.ap-southeast-1.maas.aliyuncs.com/api-ws/v1/realtime?model=qwen3.8-omni-flash-realtime`.
Push-to-talk (default, VAD off): audio is held locally while the browser transcribes; triage first; only clean turns are sent
(append → commit → response.create). Open mic (opt-in): semantic VAD, triage on the local and the server transcript, cancelling on a hit.
Tool calls: `response.function_call_arguments.done` → validate → bus → `conversation.item.create {function_call_output}` →
`response.create` after `response.done` (≤ 3 hops per turn). Barge-in: `input_audio_buffer.speech_started` or the talk button →
cut model audio, `response.cancel`, drop that response's late events, `interrupt` (duck narration, release a hold, pause).

## To go live
1. Model Studio (Alibaba Cloud International, Singapore) API key + workspace id → vault.
2. `cd rt/relay-worker && npx wrangler secret put DASHSCOPE_API_KEY`, set `WORKSPACE_ID` in wrangler.toml, `npx wrangler deploy`.
3. In `/talk/`, swap the fake socket for `createRealtimeClient({ url: 'wss://<relay>/realtime', ... })` + `createMicCapture` + `createPcmPlayer`.
