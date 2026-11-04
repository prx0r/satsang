# Spec: day-gated journeys ("each day you post opens that day")

Status: **MVP built and live as an API** in `satsang-auth` (https://auth.tantrafiles.xyz/v1/journeys, code `auth/src/app.js`
`mountJourneys`, D1 `satsang-auth`), with a browser client (`SatsangAuth.journeys` in `auth/client/auth.js`) and 42 tests
(`auth/test/journeys.test.mjs`). **No page shows it yet** (where it lives is an owner decision, §10). Ties to the journey ledger
(prx0r/nibbanahelp `specs/journey-ledger.md`, f1f5847) and OPEN-THREADS S42.

## 1. The rule
A journey is a small invite-only circle. Each member's days count from their own first entry (Day 1, Day 2, …). **You see other
members' Day N only after you have posted your own Day N.** So posting Day N opens Day N for you, and your Day N becomes readable to
everyone who has also posted theirs. Nobody can read ahead of where they have written. Days must follow in order (no skipping, no
backfill) and at most one new day per 20 hours.

## 2. Flow (API)
```
POST /v1/journeys {title, about, consent:true, vouch_required?}  -> {id, invite}   (creator joins; 3 a day)
POST /v1/journeys/:id/join {invite, consent:true}               -> {handle}       (pen name = the account's handle)
GET  /v1/journeys/mine · GET /v1/journeys/:id                  -> own progress only (no counts of anyone)
POST /v1/journeys/:id/ticket                                    -> {ticket, day, ready_at}   (when the writing box opens)
POST /v1/journeys/:id/entries {day, text, ticket[, salt, at, sig]} -> {id: sha256:…, block, held}
GET  /v1/journeys/:id/days/:n                                   -> 403 locked | {keys, entries[ciphertext…]}  (client decrypts)
DELETE /v1/journeys/:id/entries/:n   (withdraw one)   POST /v1/journeys/:id/leave   (erase all of mine here)
POST /v1/journeys/:id/key {pub}  (optional Ed25519 signing key)   POST /v1/journeys/:id/vouch {handle}
```
Non-members get 404 for everything about a journey. Withdrawn or held entries still count as "posted" for their author's gate.

## 3. Encryption, in plain words
- Every entry is locked with its own fresh key (AES-256-GCM, the "data key"). That data key is then locked with the **day key**
  for that journey and day (`K_d`, AES-256-GCM). Only the locked forms are stored (envelope encryption).
- Day keys are not stored at all: `K_d = HKDF-SHA256(JOURNEY_MASTER_KEY, "kd:<journey>:<day>:<epoch>")`, a Worker secret.
- When you open Day N, the server checks that your own Day N exists, then hands **your browser** `K_d` plus the locked entries;
  your browser unlocks them (`SatsangAuth.journeys.day`). Before you post, the server will not release `K_d` to you.
- Each entry also gets a ledger block (§5) with a **salted commitment** to the text, so a reader can later check the text was not
  altered, and withdrawing the salt + ciphertext leaves nothing that confirms a guess.

### Honest limits (say these wherever the feature is shown)
- **This is encryption at rest with the server as trusted key-holder. It is not end-to-end.** The server sees each entry in the
  clear while it encrypts it, holds the master key, and could release any day key to anyone. It protects against: a leaked database
  dump or backup (ciphertext only), casual reading in the D1 console, and lurkers/scrapers reading ahead. It does not protect against
  whoever runs the Worker, a compromised Worker or Cloudflare account, or a lawful demand on the operator.
- Once a day key is released to a member, they hold it: they can keep or share what they read that day. Leaving or withdrawing
  deletes the stored ciphertext (crypto-shredding), but cannot recall what another member already read or copied.
- The 20-hour gap, compose floor and minimum length are friction, not proof of a human (§6).

### The stronger option (not built): end-to-end with a reveal protocol
- Each member's device holds a key pair (X25519 for agreement, Ed25519 for signing; **hybrid with ML-KEM-768 (FIPS 203)** for
  post-quantum key exchange). Entries are encrypted on the device; the server stores ciphertext only and never sees text.
- **Per-day group key**: for Day N, a fresh group key `G_N` is created and wrapped to each member's public key **only after that
  member's signed Day N entry is on the log** (a reveal protocol: whoever holds `G_N` — the first poster's device, or a rotating
  member — wraps it for each new poster; MLS (RFC 9420) does this kind of group key management properly).
- **No single server can reveal**: split `G_N` with a threshold scheme (e.g. 2-of-3 Shamir) among independent witnesses (the ledger's
  witnesses, §4 of journey-ledger.md), each releasing its share only on seeing the member's signed Day N entry in a checkpoint.
- Trade-offs: needs device keys and recovery (lose the device, lose the history unless backed up); a member who posts first waits
  for someone to be online to wrap keys (or witnesses must be online); much more code to get right; moderation and the crisis hold
  (§8) become client-side only, because the server cannot read; the anti-junk floor can only check sizes and timing, not text.
- PQ note: AES-256-GCM and SHA-256 are fine against quantum attackers at today's understanding (Grover halves the margin, 128-bit
  left). The weak point is key exchange: if E2E is built, use a hybrid X25519 + ML-KEM-768 KEM, and hybrid Ed25519 + ML-DSA-65
  signatures to match the ledger's v1 policy. The MVP has no public-key key exchange, so it has no quantum exposure beyond TLS.

## 4. What is stored per entry
`entries(id, jid, uid, day, block, bid, sig, ct, iv, wdek, wiv, epoch, held, text_h, created)`. `ct` = AES-GCM ciphertext of
`{text, salt}` (AAD `entry:<id>`); `wdek` = the data key wrapped by `K_d` (AAD `dek:<id>`). `text_h` is a keyed hash of the normalised
text, used only to refuse a copy of your own earlier entry. No plaintext column exists.

## 5. Ledger continuity (journey-ledger.md §2.3–2.4)
Each entry's block: `{v:1, log:"auth.tantrafiles.xyz/journeys/<jid>/<series>", seq:day, prev:<previous block id>, kind:"entry", at,
day, backfill:false, content:{hash:[commitment], bytes, visibility:"wall"}, author}`; block id =
`SHA-256("nibbana-journey/v1/block\n" || canonical JSON)`, the same canonical form and domain prefix as the ledger. `series` is a keyed
hash of (journey, account), so the log name reveals no account id. If a member registers an Ed25519 key, every entry must carry
`salt`, `at` (±10 min) and `sig` over the 32 raw bytes of the block id; the server rebuilds the block and verifies before storing (on a
bad signature it returns the block so the client can sign it). Without a key, `author` is `satsang-auth:<series>` (server-attested only).
Witnessed checkpoints (ledger §4) are not built here.

## 6. Anti-bot, honestly
Gating stops lurkers and scrapers seeing ahead. It does not stop a bot that posts junk to unlock a day. The layers, none of which
scores spiritual content, attainment or quality:
1. A Google account (one account = one member; bulk Google accounts cost effort, not nothing).
2. **Invite-only** journeys; optional **vouching** (`vouch_required`: a member needs a vouch from the creator or anyone with ≥3 days).
3. Pace: one new day per 20 h per journey; 6 posts a day per account; 3 new journeys a day; ticket and join rate limits.
4. **Compose floor**: a ticket is fetched when the writing box opens and an entry is refused until it is 90 s old (server time).
5. **Length/filler floor**: ≥200 characters, ≥30 words, ≥15 distinct characters, no single word over 35 % of the text; not a copy of
   your own earlier entry. These say nothing about what is written.
6. **Continuity**: days in order, chained blocks, optional signatures; a bot has to keep posting every day to keep reading.
What remains: a determined person or an LLM-driven bot can write 200 plausible characters a day. The defences against that are
social (small invite-only circles, vouching, leaving), not technical. That is said plainly in the UI copy too.

## 7. Client (browser)
`<script src="https://auth.tantrafiles.xyz/auth.js">` then `SatsangAuth.journeys.create/join/mine/get/ticket/post/day/withdraw/leave`.
`day()` returns `{locked:true}` or `{entries:[{handle, mine, at, text | withdrawn, block, bid}]}` with decryption done in the browser
(WebCrypto). Order is oldest first; there is no sort by length, count or speed.

## 8. Privacy and care
- **Opt-in**: joining needs an explicit consent flag; the consent text (in `auth/src/app.js` `CONSENT`) names special-category data
  (GDPR Art. 9: religious/philosophical beliefs, possibly health), the gate, encryption at rest and that the server holds the keys.
- **Pseudonymous**: members appear under the account's pen name (generated, changeable; snapshot at join). No account id, email or
  name reaches other members.
- **Withdraw anytime**: one entry (ciphertext + wrapped key deleted; the block id stays so the chain still verifies), or leave
  (every entry, block and vouch of yours in that journey deleted the same day), or erase the account (everything, every journey).
- **Crisis hold**: entries matching a deliberately broad list (suicide, self-harm, wanting to die, overdose…) are stored but **held**:
  they unlock the author's day, are never shown to anyone else, and the author sees support links (findahelpline.com). False
  positives are held, not punished. There is no release flow yet (owner-mediated; see §10). This mirrors ledger §9.4.
- **No rankings, no streaks, no counts**: the journey view shows only your own progress; no member counts, no "N people posted".
- **Erasure (GDPR-ish)**: covered above. Caveat: D1 Time Travel keeps point-in-time history for 7 days on the Workers Free plan
  (30 on Paid; https://developers.cloudflare.com/d1/reference/time-travel/), so deleted rows (still ciphertext) remain restorable by the
  operator for that window. Say so if a person asks for complete erasure.

## 9. Tests (`cd auth && npm test`)
Gate locked before posting; compose floor; too short; filler; skipping a day; forged ticket; block id recomputes; no plaintext at rest;
read through the real browser client (decrypt in the client); commitment matches; two members see each other only after both post;
no account ids leak; crisis hold visible to author only; 20 h gap; duplicate refused; chain `prev`; withdraw shreds content but keeps
the block; leave erases; signed entries (refused unsigned, bad sig, accepted good sig); vouching; no counts in the view; account erasure.

## 10. Open
- Where the wall lives (owner): a page on nibbana.stonedoorway.com (the white-page rules apply: raw `<pre>`, no styling) or a
  Satsang page. The API and client are ready for either.
- Crisis hold release flow (author asks, owner reviews) and Satsang's shared safety triage instead of the keyword list.
- Witnessed checkpoints + browser verifier for journey blocks (ledger v1), then the E2E option in §3 if the circle grows beyond friends.
