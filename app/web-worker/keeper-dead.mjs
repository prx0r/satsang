// Keeper hook (read-only, fail-open): hide clips whose YouTube video keeper found dead (removed, private or not
// embeddable for 3 runs in a row) by marking them "status":"removed" in /clips.json, which the client already drops.
// Source: keeper's dead.json on the public keeper-state branch, cached 1 h. Any error = serve clips.json unchanged.
// CPU budget (Workers Free, 10 ms): at most MAX ids are marked (indexOf ~0.7 ms each on the 4 MB file), the result is
// memoised per isolate and kept in the edge cache, so the cost is paid about once per colo per hour.
// Beyond MAX, the oembed findings ask an agent to drop the clips at the source (keeper/AGENTS.md).
const DEAD_URL = 'https://raw.githubusercontent.com/prx0r/satsang/keeper-state/keeper/state/dead.json'
const MAX = 10
let memo = { at: 0, ids: null, key: '' }, out = { key: '', body: null }

async function deadIds() {
  if (memo.ids && Date.now() - memo.at < 3600e3) return memo
  try {
    const r = await fetch(DEAD_URL, { cf: { cacheTtl: 3600, cacheEverything: true }, signal: AbortSignal.timeout(1500) })
    if (!r.ok) throw new Error('dead.json ' + r.status)
    const j = await r.json()
    const ids = (Array.isArray(j.clips) ? j.clips : []).filter((x) => typeof x === 'string' && /^[\w@.-]{3,40}$/.test(x)).slice(0, MAX)
    memo = { at: Date.now(), ids, key: String(j.updated || '') + ':' + ids.join(',').length }
  } catch { memo = { at: Date.now() - 3000e3, ids: memo.ids || [], key: memo.key } } // retry in ~10 min, keep the last good list
  return memo
}

function mark(body, ids) {
  const pos = []
  for (const id of ids) { const k = `{"id":"${id}"`; const i = body.indexOf(k); if (i >= 0) pos.push(i + k.length) }
  if (!pos.length) return body
  pos.sort((a, b) => a - b)
  let s = '', last = 0
  for (const p of pos) { s += body.slice(last, p) + ',"status":"removed"'; last = p }
  return s + body.slice(last)
}

// body: the clips.json text; version: anything that changes when the deployed clips change
export async function withoutDeadClips(body, version = '') {
  try {
    const { ids, key } = await deadIds()
    if (!ids || !ids.length) return body
    const k = encodeURIComponent(`${key}|${version}|${body.length}`)
    if (out.key === k) return out.body
    const cacheKey = new Request('https://keeper-cache.invalid/clips.json?k=' + k)
    const cache = typeof caches !== 'undefined' ? caches.default : null
    const hit = cache && (await cache.match(cacheKey))
    const marked = hit ? await hit.text() : mark(body, ids)
    if (cache && !hit) await cache.put(cacheKey, new Response(marked, { headers: { 'cache-control': 'public, max-age=3600' } })).catch(() => {})
    out = { key: k, body: marked }
    return marked
  } catch { return body }
}
