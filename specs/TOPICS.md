# Wiser: how topics are made and kept (spec, 2026-10-20)

A topic is **a question people bring, answered by several traditions**: Rebirth, Death, the Self, Karma, Prayer, Grace.
It is the main organising unit of Wiser: the loop flashes topics, hubs are topics, collections are built on topics.

Today: vocabulary v2 in `app/schema/topics.json` (32 roots, 56 nodes with leaves), 6 hand-built hubs in
`wisegraph/hubs.json` (rebirth, death, self, kamma, meditation, awakening) with intros, 3–7 sub-questions each, essays
and practices, takes for 8 topics. Under the publish gate below, **28 roots already qualify** (smallest: gnosis, 19 clips).

## 1. Shape
- **Tree, max depth 3**: `root/leaf/subleaf` (`death/bardo`, `meditation/breath/anapanasati` later). A clip can sit on
  several branches. Leaves inherit to roots for counting (a `death/bardo` clip counts for `death`).
- **Sub-questions** (`topic.questions[]`) are the hub's sections: "What is reborn?", "Remembering past lives", "Between lives:
  the bardo". Each clip may answer one (`clip.topics[].question`). Questions are not topics; a question that grows past
  25 clips and 3 traditions is promoted to a leaf.
- **Terms**: source-language words folded into the topic (`punabbhava`, `saṃsāra`, `gilgul`, `metempsychosis`) so
  cross-tradition clips meet on one node.
- **Kinds of hub** a topic can carry (all from the same record): a compare hub (one column per tradition), a practice
  hub ("Meditations about death": Collection kind meditation-series), a visualisation hub ("Visualisations for the
  subtle body": visualisation-cycle), a journey ("Seven days with death"). These are Collections pointing at the topic, not
  new topic types.

## 2. Seed taxonomy
Keep v2's 32 roots as the seed and add these roots as the deep sourcers' material lands (each needs the gate in §6):
`prayer`, `grace` (now under faith), `devotion`, `the-body` (subtle body, chakras, channels), `energy` (prana, qi, kundalini),
`mantra-and-sound`, `ethics` (now virtue), `suffering-and-healing`, `love`, `nature` (Druidry, paganism, Daoism), `magic-and-ritual`,
`dreams`, `time-and-eternity`, `the-teacher` (now guru), `silence`, `emptiness` (now under self), `non-duality`, `liberation`
(now awakening). Rule: a root names a **question**, not a school ("non-duality" yes, "advaita" no: that is a tradition).

## 3. Assignment pipeline (per clip)
1. **Title + description rules** (live: `kw` regex per node, word-boundary, confidence 0.9 title / 0.7 description).
2. **Transcript segmentation (internal only)**. For transcripts in `transcripts-internal/` (never published, guarded by
   `deploy.sh`'s two checks): split into 60–180 s windows, embed each window (Workers AI `@cf/baai/bge-m3`, multilingual),
   and run TextTiling-style boundary detection on cosine drops between adjacent windows (depth score > μ + 0.5σ). Each
   segment gets: topic similarities against topic centroids (centroid = mean embedding of label + blurb + terms + 20
   reviewed segments), a 6-word internal label, and its start/end. Segments 1–20 min become **virtual-clip proposals** at
   topic boundaries (the same `videoId@start` mechanism as today). Only ids, times and topic ids leave the internal store.
3. **LLM-assisted labelling.** For each new clip/segment, an LLM sees: title, description, the internal segment text
   (in the build machine only), the topic tree with blurbs, and the hub's sub-questions; it returns
   `[{topic, conf, question?, rationale}]` constrained to existing ids, or `propose_topic {label, parent, why}`.
   Accepted automatically when `conf ≥ 0.8` AND it agrees with rule or embedding evidence; otherwise queued.
4. **Confidence fusion**: `conf = 1 − Π(1 − c_i)` over independent evidence (rule, embedding, LLM), capped 0.95 without a
   human; `src` records the strongest evidence.

## 4. Review queues (human in the loop)
A small admin view (dark design, same components) with four queues, each item one keypress (A accept, R reject, E edit):
| queue | fed by | decision |
|---|---|---|
| Low-confidence tags | fusion conf 0.5–0.8 or disagreement | accept / move to another topic / drop |
| Virtual-clip proposals | segmentation | accept bounds (± 15 s nudge) / reject; editorial title |
| Topic proposals | LLM `propose_topic`, user proposals (§7), questions over 25 clips | create as `proposed` / merge into existing / reject |
| Takes and intros | LLM draft from the hub's clips + textbook positions | edit to Wiser's own one line; never a quote |
Reviewer actions are logged (`topic_reviews(item, action, by, at)`) and reviewed tags get `src: human`, conf 1.0.

## 5. Merge and split rules
- **Merge** two topics when ≥ 60 % of the smaller one's clips are also on the larger, or their centroids' cosine > 0.88,
  or a reviewer says they are one question. The smaller becomes `state: merged, mergedInto`; its id stays as an alias
  forever (old URLs redirect). Examples already applied: `karma → kamma`, `reincarnation → rebirth/western`.
- **Split** a topic when it passes 300 clips AND clustering its clip embeddings (k = 2–5, silhouette > 0.25) yields clusters
  that each pass the publish gate; each cluster becomes a leaf, labelled by the LLM and reviewed. Or when a sub-question
  passes 25 clips and 3 traditions (promotion).
- **Retire** when a topic falls below half the gate for 60 days; it disappears from the loop and hubs but keeps its URL
  (shows "Talks arriving").

## 6. Minimum depth to publish (the gate)
A topic is shown in the loop, the Topics tab, the sitemap and MCP `nextTopics` only when **all** hold:
- ≥ **12 ballot-eligible clips** and ≥ **3 traditions** (distinct school nodes, across ≥ 2 families for a root),
- ≥ **5 teachers**, of whom ≥ 3 are **main-tier** (≥ 8 clips overall) so a flash never leans on one-video voices,
- an **intro** (≤ 900 chars) and ≥ **3 sub-questions** reviewed (hubs only; the loop needs just the label and blurb).
States: `seed → growing` (has clips, below gate) `→ published` (gate met + intro) `→ merged | retired`.
Today's 28 qualifying roots can go into the loop at once; the 6 with hubs have full pages.

## 7. User-proposed topics
"Suggest a topic" on the Topics tab and in the bridge card: a label, an optional question, optionally 1–3 talks. Stored in
`topic_proposals(id, who, label, question, clips, at, votes)`. Others can +1 (one per device). At 10 +1s, or when an
LLM pass finds ≥ 12 matching clips across ≥ 3 traditions, it enters the review queue. The proposer is credited on the hub
("Suggested by @handle") if they have a public profile.

## 8. Hub layout (dark design, no restyle)
Uses the existing `#topic/` page skeleton (dark `--bg #0a0d14`, serif `--display` Cormorant Garamond headings, gold
`--gold #e8cf96` and amber `--red #d9982f` accents, `--panel` cards, Inter Tight body). Order:
1. **Hero**: topic name large in the serif, gold hairline under it; the tradition line ("Theravāda · Advaita Vedānta ·
   Platonic tradition · …"); portrait collage; the intro. Buttons: **Play this topic** (Topic flash locked to this topic)
   and **Compare two takes**.
2. **Tabs** (sticky, muted labels, gold underline on the active): **Watch · Read · Practise · Atlas thread · Places · Teachers**.
   - *Watch*: the sub-questions as sections; each a horizontal rail of talks chosen by RANKING §2 (MMR across
     traditions), tradition label on every tile; then "By tradition" columns (today's view) with the one-line take on top.
   - *Read*: texts and essays (free editions only) grouped by tradition, with publisher and "free from the publisher".
   - *Practise*: practices grouped by kind (meditation, visualisation, enquiry, chant, ritual, movement), cautions shown;
     collections of kind meditation-series / visualisation-cycle / journey on this topic; "Start the 7-day journey".
   - *Atlas thread*: the concept thread (e.g. `c-rebirth`, 16 holders across 11 streams) as a vertical timeline in gold,
     each node linking to its person/text page; "See it on the Atlas".
   - *Places*: places whose traditions hold this topic's main practices (e.g. Death → monasteries with charnel-ground or
     maraṇasati retreats, Tibetan centres with phowa courses), nearest first via `/geo.json`.
   - *Teachers*: main-tier teachers on this topic by tradition, then "More voices" collapsed.
3. **Related topics**: 4–6 gold-outlined chips from RANKING §4 ("Next: Karma · The Self · Impermanence").
Empty tabs are hidden, as profiles already do.
