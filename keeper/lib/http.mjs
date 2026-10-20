// Polite HTTP for keeper: timeouts, one request per host per second (configurable), HEAD then GET, no body download unless asked.
const lastHit = new Map() // host -> ms of the last request start
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function makeHttp({ userAgent, perHostMs = 1000, timeoutMs = 20000, hostMs = {} } = {}) {
  async function polite(url) {
    const host = new URL(url).host, gap = hostMs[host] ?? perHostMs
    for (;;) {
      const now = Date.now(), last = lastHit.get(host) || 0
      if (now - last >= gap) { lastHit.set(host, now); return }
      await sleep(gap - (now - last) + Math.random() * 20)
    }
  }
  // fetch with timing; body: 'text' | 'none' | 'json'. Never throws: returns {ok,status,ms,ttfb,error,headers,text,url}
  async function req(url, { method = 'GET', body = 'text', headers = {}, data, timeout = timeoutMs, politeness = true, redirect = 'follow' } = {}) {
    if (politeness) await polite(url)
    const t0 = Date.now()
    try {
      const res = await fetch(url, { method, redirect, headers: { 'user-agent': userAgent, accept: '*/*', ...headers }, body: data, signal: AbortSignal.timeout(timeout) })
      const ttfb = Date.now() - t0
      let text = null, bytes = 0
      if (body === 'none' || method === 'HEAD') { try { await res.body?.cancel() } catch { /* ignore */ } }
      else { const buf = Buffer.from(await res.arrayBuffer()); bytes = buf.length; text = buf.toString('utf8') }
      return { ok: res.ok, status: res.status, ms: Date.now() - t0, ttfb, headers: res.headers, text, bytes, url: res.url || url, redirected: res.redirected }
    } catch (e) {
      const code = e?.cause?.code || e?.name || 'error'
      return { ok: false, status: 0, ms: Date.now() - t0, error: `${code}${e?.message && !String(code).includes(e.message) ? ': ' + e.message : ''}`.slice(0, 200), url }
    }
  }
  // link check: HEAD, then GET when HEAD is refused or odd. Verdict: ok | dead | unknown (403/429/bot walls are not evidence of death)
  async function linkCheck(url) {
    let r = await req(url, { method: 'HEAD', timeout: 15000 })
    if (!r.ok) {
      const g = await req(url, { method: 'GET', body: 'none', timeout: 20000, headers: { accept: 'text/html,application/xhtml+xml,*/*;q=0.8' } })
      if (g.ok || g.status) r = g
    }
    let verdict = r.ok ? 'ok' : 'dead'
    if ([401, 403, 405, 406, 408, 418, 429, 451, 999].includes(r.status) || (r.status === 503 && /cloudflare|captcha/i.test(r.headers?.get?.('server') || ''))) verdict = 'unknown'
    if (r.status === 0 && /TIMEOUT|Timeout|ECONNRESET|UND_ERR_SOCKET/.test(r.error || '')) verdict = 'dead' // counted; 3 in a row needed before "dead"
    return { verdict, status: r.status, error: r.error, ms: r.ms, final: r.url }
  }
  // run fn over items with a concurrency cap (host politeness still applies inside req)
  async function pool(items, n, fn) {
    const out = new Array(items.length); let i = 0
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k) } }))
    return out
  }
  return { req, linkCheck, pool, polite }
}
