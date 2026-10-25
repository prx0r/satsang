# Satsang "Ask while you practise" (spec v0, 2026-10-20)

> **Status (2026-10-25):** **not started** live: realtime voice/LLM needs a Qwen key + spend approval (chat/README; off).

User vision: mid-practice (e.g. Nadi Shodhana), speak a question ("I feel lightheaded", "how does this work?"). The practice pauses, an answer is spoken in real time, and the Q&A is stored against that practice so the next person with a similar question gets an instant cached answer. Common questions are preloaded.

## Flow
1. **Trigger**: hold-to-talk (space / remote OK long-press / an on-screen mic) or the wake phrase "pause". The player pauses at a safe point: if mid-hold, it releases the hold first ("breathe out gently") — never freeze someone in retention.
2. **Transcribe**: the browser Web Speech API (free) → fallback Whisper via API. Context captured: practice id, phase, round, params (ratio), level, elapsed, beginner flag.
3. **Safety triage FIRST (deterministic, no LLM, <100 ms)**: a keyword/intent classifier for red flags (dizzy/lightheaded/faint, chest pain, can't breathe, panic, numbness, nausea, vision changes, pregnancy). Hit → a pre-written, pre-voiced safety script per practice (e.g. "Stop the holds. Breathe normally through both nostrils. Sit or lie down until it passes."), and the player switches to a no-retention version or stops. Chest pain/fainting → "stop and seek medical help". Logged as a safety event.
4. **Cache lookup**: embed the question; nearest neighbours in the QA library filtered by practice (then by tradition/method, then global). Score ≥ 0.86 and the same safety class → play the cached answer audio instantly. 0.75–0.86 → play it, labelled "similar question".
5. **Miss → generate**: an LLM (OpenRouter key in the vault) grounded ONLY in the practice JSON (steps, sources, contraindications), linked concepts, and approved QAs; it must answer in ≤ 60 spoken words, plain, no medical diagnosis, citing the source when it's a lineage claim. Streamed to TTS (Fish; browser fallback). Target first audio < 2 s.
6. **Resume menu** (voice or tap): Resume · Easier version (beginner params) · Show me (replay the phase slowly with the visual) · Stop. Optional 👍/👎 on the answer.
7. **Store**: the new QA goes in as `candidate` (private to the asker until reviewed). Promotion to shared requires: PII-scrubbed, a safety lint pass, then agent/keeper review (and human review for safety class ≠ info). Merged variants: similar questions attach as `variants` of one canonical QA.

## QA record (git library: prx0r/satsang-qa, qa/<practice-id>.jsonl; runtime copy in D1 + an embeddings index)
```json
{ "id":"qa_ns_lightheaded", "practice":"nadi-shodhana-sivananda", "scope":"practice|method|global",
  "phase":["hold_in"], "intent":"lightheaded", "safety":"stop|caution|info",
  "question":"I feel lightheaded", "variants":["dizzy","head is spinning","feel faint"],
  "answer_spoken":"…≤60 words…", "answer_long":"…markdown with why + sources…",
  "action":{"player":"switch_params","params":{"ratio":[4,0,8,0]}},
  "sources":[{"url":"…","label":"Science of Pranayama"}], "confidence":"high",
  "status":"preloaded|candidate|approved|retired", "reviewed_by":"agent|human", "verified_on":"2026-10-20",
  "audio":{"voice":"fish:<id>","hash":"…","url":"/qa-audio/<hash>.mp3"},
  "stats":{"asked":0,"helpful":0,"unhelpful":0,"last_asked":null}, "embedding_model":"…" }
```
Git is the source of truth (diffable, reviewable, open data later, CC BY); a build step syncs approved QAs to D1 and the index. Personal questions never enter git; only scrubbed, approved canonical QAs do.

## Preload (per practice, ~15–25 each, pre-voiced)
Safety: lightheaded, dizzy, tingling/pins and needles, heart racing, anxiety, can't hold, headache, nausea, pregnant, high blood pressure. Technique: blocked nostril, which fingers (Vishnu mudra), counts too fast/slow, mouth open?, how long per day, before or after food, eyes open or closed, where attention goes, feeling heat/cold, how to know it's working. Theory: what are ida/pingala, why alternate, what the hold does. Generated from the practice JSON + sources by the LLM, then reviewed; this is the first job for the Sivananda miner too.

## Matching details
Embeddings small enough for the edge (e.g. a 384-dim model; Workers AI or computed at build for preloads; the query embedded in the API). Keep per-practice indexes small (hundreds), so a brute-force cosine in the Worker is fine; Vectorize later if needed. Ranking: similarity × (approved 1.0 / candidate 0.6) × helpful-rate prior; the safety class must match or be stricter.

## Learning loop
- Weekly (keeper + a Hark scheduled task): cluster new candidates, merge variants, draft canonical answers, flag safety ones for human review, and promote. Unhelpful votes → re-draft.
- Questions that recur feed back into the practice itself (add a step note, adjust the beginner default) and into the Theory tab.
- The profile: safety events and questions are logged to the user's private Session (e.g. "lightheaded at round 3 with 1:4:2" → suggest 1:2:2 next time).

## Privacy and safety
Audio is never stored (only text). Questions are private by default; shared only after scrubbing. Clear "not medical advice"; red-flag scripts are written in advance and reviewed. The LLM can never extend holds or increase intensity — only the progression rules can, and only between sessions.

### Where Ask lands in the planned session log (from satsang-extensions 42, archived 2026-10-21; not built)
Each Ask exchange during a sit is attached to that sit's `practice_session` row (PRACTICE-ENGINE §7.1) as private text: `{t (s into the
session), phase (stage id), question, action taken (continue|switch_params|offer...), safety?: true}`; never audio. Safety events also feed
`due[].why` in the next daily snapshot ("last time: lightheaded at round 3 -> try the gentler ratio"), so the guidance carries over without the
user retelling it. Nothing is stored server-side until accounts exist; the device keeps it locally and in `/me/export` later.

## Agent-native
MCP: `ask_practice(practice, question, phase?)` returns the best approved QA or null (no generation for agents by default); `list_practice_questions(practice)`. Each approved QA renders on the practice page as an FAQ section (visible text, good for Google AI answers).

## v0.2 Realtime voice layer: Qwen Omni Realtime (user decision 2026-10-20)
- Model: qwen3.8-omni-flash-realtime (Alibaba Model Studio, listed 2026-09-21; WebSocket/WebRTC/AOQ; semantic interruption; function calling; remote MCP tools; voice cloning; regions Singapore + Beijing). NOT qwen3-omni-flash-realtime (retired 2026-10-10). Keep the layer provider-agnostic (an OpenAI-Realtime-style event adapter) so GPT realtime, Gemini Live or others can swap in.
- Topology: browser mic (WebRTC or WS, PCM16 16 kHz) → our API Worker relay (holds the key; never in the browser; per-session caps and minutes limit) → Qwen realtime. Server VAD + semantic interruption: the user can talk over the guide; the guide's speech is cut and the player responds.
- The model is the conversational surface; the player state is the truth. Function tools exposed: pause_practice, resume_practice, switch_params(level), replay_phase_slow, get_practice_context, lookup_qa(question) → cached answer, log_question(question, answer, safety). Via remote MCP it can also call the Satsang MCP (concepts, sources).
- Cache stays in front: client-side intent match + lookup_qa first; on a confident hit, play pre-rendered audio and don't open a model turn (cost + latency). The model is only for misses and follow-ups.
- Safety triage remains deterministic on the client BEFORE the model hears anything; the model cannot extend holds or raise intensity (tools don't allow it).
- System prompt: the practice JSON + contraindications + approved QAs for this practice; ≤60-word answers; calm voice (a cloned/approved voice, never a real teacher's).
- Cost guard: realtime audio is token-priced per minute of audio; the relay keeps the session closed except while the user is talking (push-to-talk default, open-mic opt-in), plus a monthly budget cap. Needs the user's Model Studio account + API key (vault) before building the live path; build the adapter + a mock first.

## v0.3 Built: realtime control layer (engine/rt, engine/talk; 2026-10-21)
Code: `engine/rt/` (README there is the reference), mock at `/talk/` on the engine preview. Changes against v0.2 above:
- **Command bus is the boundary.** Every actor (model tools, user taps, safety, host) goes through `bus.exec(cmd, args, {source})`.
  Commands: play, pause, resume, seek_phase, replay_phase(slow?), repeat_round, set_level, extend_pause, highlight_locus, show_explainer,
  speak, end (+ internal interrupt, release_hold, lock). v0.2's tool names map as: pause_practice → pause, resume_practice → resume,
  switch_params(level) → set_level (gentler | standard), replay_phase_slow → replay_phase {slow:true}; get_practice_context and
  lookup_qa kept; log_question is not a model tool (the client logs every exchange itself).
- **Shared clock:** the compiled timeline's t, owned by the player; phase addresses {id, round} (compile 0.3 ids); the host ticks the bus.
- **Guards are a load budget**, not just "no extend": retention and round starts still to come under any plan (seek, replay, repeat,
  recompile) must fit the baseline compiled at session start; holds are never replayed or slowed; a pause or barge-in mid-hold releases to
  the out-breath; extend_pause only in silence pauses (20 s/call, 40 s/pause, 120 s/session); after any safety event no further holds
  run (skipped live) and the model cannot resume a stop-class pause.
- **Triage classes:** emergency / stop / soften / caution / check (negated emergency words), fixed wording in `rt/safety.mjs` SCRIPTS
  (to be voiced and reviewed like the preload answers). Push-to-talk keeps triage strictly before the model; open mic adds a server-transcript
  net that cancels the model turn.
- **Relay:** `rt/relay-worker` (not deployed): Origin allowlist, Workers Rate Limiting (6 sessions/min/IP), client events limited to
  session.update (clamped: instructions ≤ 12k chars, max_tokens ≤ 600, no web search, MCP only to the Satsang MCP), audio append (≤ 5 min
  per session), commit/clear, response.create (≤ 120, overrides dropped), response.cancel, function_call_output items; 15 min session cap,
  2 min idle; optional daily seconds budget in KV.
- **Tools in both shapes:** Qwen `{type:'function', function:{name, description, parameters}}`, OpenAI `{type:'function', name, ...}`
  (`rt/tools.mjs`). Phase and locus enums come from the compiled timeline and the grammar.
- Still to build: the cache-first QA path (lookup before opening a model turn), pre-voiced safety scripts (Fish), the live mic path in
  /talk/ once the relay has a key, and the Session log rows from "Where Ask lands".
