# Satsang "Ask while you practise" (spec v0, 2026-10-20)

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
