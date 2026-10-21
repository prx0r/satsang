// Satsang realtime relay (Cloudflare Worker). NOT DEPLOYED: needs a Model Studio key (none in the vault as of 2026-10-21).
// Browser  ──wss──▶  /realtime (this Worker: origin check, rate limit, event filter, caps)  ──wss + Bearer──▶  Model Studio
//   upstream: wss://{WORKSPACE_ID}.ap-southeast-1.maas.aliyuncs.com/api-ws/v1/realtime?model=qwen3.8-omni-flash-realtime
// Bindings (wrangler.toml): secret DASHSCOPE_API_KEY · var WORKSPACE_ID · var EXTRA_ORIGINS (comma list, optional)
//   ratelimit RL_RT (sessions per IP per minute) · optional KV RT_BUDGET (daily seconds budget across all users) · var DAILY_BUDGET_S
import { originAllowed, filterClientEvent, newSessionState, sessionExpired, CAPS } from './policy.mjs'

const MODEL = 'qwen3.8-omni-flash-realtime'
const J = (status, o) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url)
    if (url.pathname === '/health') return J(200, { ok: true, configured: !!(env.DASHSCOPE_API_KEY && env.WORKSPACE_ID), model: MODEL })
    if (url.pathname !== '/realtime') return J(404, { error: 'not_found' })
    const origin = req.headers.get('origin')
    if (!originAllowed(origin, env.EXTRA_ORIGINS)) return J(403, { error: 'origin_not_allowed' })
    if (req.headers.get('upgrade')?.toLowerCase() !== 'websocket') return J(426, { error: 'websocket_required' })
    if (!env.DASHSCOPE_API_KEY || !env.WORKSPACE_ID) return J(503, { error: 'relay_not_configured' })
    const ip = req.headers.get('cf-connecting-ip') || 'unknown'
    if (env.RL_RT) { const { success } = await env.RL_RT.limit({ key: `rt:${ip}` }); if (!success) return J(429, { error: 'rate_limited' }) }
    const day = new Date().toISOString().slice(0, 10), budget = +(env.DAILY_BUDGET_S || 0)
    if (env.RT_BUDGET && budget) { const used = +(await env.RT_BUDGET.get(`s:${day}`)) || 0; if (used >= budget) return J(429, { error: 'daily_budget_reached' }) }

    // one model only; the client cannot pick another. fetch() with Upgrade: websocket opens the upstream socket (https scheme).
    const upstreamUrl = `https://${env.WORKSPACE_ID}.ap-southeast-1.maas.aliyuncs.com/api-ws/v1/realtime?model=${MODEL}`
    let up
    try {
      const r = await fetch(upstreamUrl, { headers: { Upgrade: 'websocket', Authorization: `Bearer ${env.DASHSCOPE_API_KEY}` } })
      up = r.webSocket
      if (!up) return J(502, { error: 'upstream_refused', status: r.status })
    } catch { return J(502, { error: 'upstream_unreachable' }) }
    up.accept()

    const [client, server] = Object.values(new WebSocketPair())
    server.accept()
    const st = newSessionState()
    const close = (code, reason) => { try { server.close(code, reason) } catch { } try { up.close(1000, 'relay closing') } catch { } }
    const timer = setInterval(() => { const why = sessionExpired(st, CAPS); if (why) { clearInterval(timer); close(4000, why) } }, 5000)

    server.addEventListener('message', e => {
      const r = filterClientEvent(e.data, st, CAPS)
      if (!r.ok) {
        server.send(JSON.stringify({ type: 'error', error: { type: 'relay_policy', code: r.reason, message: `dropped by relay: ${r.reason}` } }))
        if (r.close) { clearInterval(timer); close(4001, r.reason) }
        return
      }
      up.send(r.data)
    })
    up.addEventListener('message', e => { try { server.send(e.data) } catch { } })
    const done = () => {
      clearInterval(timer); close(1000, 'closed')
      if (env.RT_BUDGET && budget) {
        const secs = Math.ceil((Date.now() - st.started) / 1000)
        ctx.waitUntil(env.RT_BUDGET.get(`s:${day}`).then(v => env.RT_BUDGET.put(`s:${day}`, String((+v || 0) + secs), { expirationTtl: 86400 * 3 })))
      }
    }
    server.addEventListener('close', done); up.addEventListener('close', done)
    server.addEventListener('error', done); up.addEventListener('error', done)
    return new Response(null, { status: 101, webSocket: client })
  },
}
