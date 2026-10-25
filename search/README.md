# Satsang enquiry lens (semantic search)

One persistent question at the top of every tab; Watch / Topics / Teachers / Places / Practise / Ask re-rank around it.
Spec: `../../wiser-search-index/SERVE-SPEC.md` (outside this repo, with the index builder and the eval).

## Pieces
| Piece | Where | What |
|---|---|---|
| Worker `satsang-search` | `search/worker/` → https://satsang-search.tradesprior.workers.dev | `GET /search`, `/similar`, `/health`. Ids + scores only. |
| Index builder | `../wiser-search-index/scripts/ingest_talks.py` | Incremental talk index from the live catalogue (embeds only new/changed talk docs, local bge-small on CPU). |
| Upload | `search/tools/upload-index.mjs` | Packs BM25 to binary, writes `idx/<ver>/*` to KV `satsang-search-idx`, flips `idx/current`, prunes older versions. Skips when the content hash is unchanged. |
| Pipeline step | `app/tools/search-index.sh`, `sh app/deploy.sh search` | ingest → upload → worker deploy. `deploy.sh build` prints a NOTE when clips.json changed since the last ingest (`search/.ingested`, gitignored). |
| Client | `app/src/lens.js` + `app/site/lens.css` | Bar + per-tab panel; joins ids to clips/wise/collections/places-index already on the page. |
| Tests | `search/test/eval-live.mjs` (68 checks over the 10 eval queries + /similar + filters), `tools/check/lens-phone.mjs` (390 px tabs, overflow, labels, held, screenshots → `shots-lens/`) |

## Worker
- Free plan only: Workers Free, Workers AI `@cf/baai/bge-small-en-v1.5` with **`pooling:'cls'`** (parity 1.0 with the local index; the
  default mean pooling is wrong), KV free tier. On AI error the response is `degraded:'lexical'` (BM25 only) and is not cached.
- Talks: 1-bit Hamming shortlist (cand 500, `fastknn.mjs`, SWAR popcount) → int8 rescore → RRF with metadata BM25 (semantic 1.0 / BM25 0.7, k 60).
  `conf` = mean cosine of the top 3 semantic hits. Below **0.66** the chips + similar are anchored on the best-matching series that has talks
  (`anchor: "series:<id>"`) and the client leads with Series + Practices.
- Chips: Σ1/(rank+2) over the top 8, topic/tradition idf-damped. Similar: neighbours of mean(top 3) + 0.5·q within the top 6 chips, with `via`.
- Watch (transcript moments): passage knn, cosine floor 0.66, ≤2 per video, ≤3 per teacher, only for talks in the catalogue.
- Held teachers (public red-flag subjects + BRIEF "main teachers held": Sucitto, Kornfield, Ramdev) are in `meta.held`; their talks are
  excluded from every scan (and filtered again in the client). Places tied to them are dropped client-side.
- Filters: `teacher=`, `topic=`, `tradition=`, `series=` restrict the scan (chip taps use them). `/similar?clip=&within=type:id&k=`.
- Cache: `caches.default`, key = normalised params + index ver + `CODE_V` (bump CODE_V when ranking/shape changes). Per-isolate token bucket (30, refill 1 per 2 s).
- No transcript text is stored or served: vectors, ids, timestamps, facets, BM25 postings over metadata tokens only. `passages.bm25.json` is never uploaded;
  the uploader refuses a passages.ids.json that carries strings longer than an id.
- CPU (wrangler tail, Workers Free): warm 2–8 ms per uncached search; the first requests on a fresh isolate (decode + JIT) take 16–77 ms. All
  observed outcomes `ok`, but cold starts exceed the nominal 10 ms. See Known gaps.

## Client (lens.js)
- `?q=` in the URL or the bar starts a question; it persists (localStorage `wiser.lens`) and stays in the URL for sharing.
- Labels: every talk card says **Metadata match** (title/teacher/topics/why-line) or **Transcript moment · m:ss** (gold, only where passages exist;
  opens a youtube-nocookie embed at that time). Similar cards show "because: …".
- Talks: tier boost gold ×1.15 / strong ×1.07, footage dropped, re-uploads deduped (teacher + title).
- Places: teacher ties + 0.5·tradition overlap; Goenka directory rows skipped; pilgrimage / sacred-site / bookshop / university only with a practice
  offer (`po:1` in places-index.json, set by build-place-pages.mjs); held teachers' places dropped.
- Ask: hands the question to the deterministic path builder (`#ask?q=…&go=1`, satsang-chat; no LLM).

## Run
```
sh app/deploy.sh search                      # after catalogue changes: ingest + KV upload + worker deploy
SKIP_INGEST=1 sh app/tools/search-index.sh   # upload only
node search/test/eval-live.mjs               # live eval -> search/test/eval-live.md
node tools/check/lens-phone.mjs shots-lens "fear of death|middle pillar"   # needs sh tools/shots/shot-setup.sh
```
If `/tmp/pyt` (torch CPU) is gone, `ingest_talks.py` still repacks when nothing needs embedding; to embed new talks reinstall it (see `../wiser-search-index/scripts/env.sh`).

## Known gaps
- Cold-isolate CPU is above 10 ms (decode + JIT); warm requests fit. If Cloudflare starts rejecting cold starts, precompute the inverted facet
  lists and BM25 map at upload time or move them to lazy init.
- Passages cover 1,472 of 8,165 (238 talks, Hillside-heavy); YouTube blocks caption fetches from the sandbox and runners.
- Rare terms named only inside talks (phowa, middle pillar) depend on titles/why-lines; the low-confidence path leans on series/practices.
- The index builder lives outside the public repo (`work/wiser-search-index`).
