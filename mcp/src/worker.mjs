// Cloudflare Worker entry (wrangler bundles the JSON and text imports). Live at MCP_BASE/mcp (../../domain.mjs).
// Transports: Streamable HTTP (POST /mcp, stateless) and the legacy HTTP+SSE transport (GET /sse + POST /messages), whose
// streams live in a small Durable Object per session (SseSession) so a POST can reach the stream from any isolate.
// REST mirror under /api/*, OpenAPI at /openapi.json, discovery files at /llms.txt, /llms-full.txt, /.well-known/mcp.json.
import data from '../data/wiser.mcp.json'
import llms from '../discovery/llms.txt'
import llmsFull from '../discovery/llms-full.txt'
import mcpJson from '../discovery/mcp.json'
import { buildIndex, makeFetch, memorySessions, memoryLimiter } from './core.mjs'

const SSE_HEADERS = { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', 'access-control-allow-origin': '*', 'x-accel-buffering': 'no' }

export class SseSession {
  constructor(state) { this.state = state; this.w = null; this.ping = null; this.enc = new TextEncoder() }
  close() { clearInterval(this.ping); this.ping = null; try { this.w?.close() } catch { /* gone */ } this.w = null }
  async fetch(req) {
    const u = new URL(req.url)
    if (u.pathname === '/open') {
      this.close()
      const ts = new TransformStream(); this.w = ts.writable.getWriter()
      this.w.write(this.enc.encode(`event: endpoint\ndata: ${u.searchParams.get('endpoint')}\n\n`))
      this.ping = setInterval(() => { if (this.w) this.w.write(this.enc.encode(': ping\n\n')).catch(() => this.close()) }, 20000)
      return new Response(ts.readable, { headers: SSE_HEADERS })
    }
    if (u.pathname === '/push') {
      if (!this.w) return new Response('closed', { status: 404 })
      try { for (const m of await req.json()) await this.w.write(this.enc.encode(`event: message\ndata: ${JSON.stringify(m)}\n\n`)) } catch { this.close(); return new Response('closed', { status: 404 }) }
      return new Response('ok')
    }
    return new Response('not found', { status: 404 })
  }
}

const mem = memorySessions(), memLimit = { api: memoryLimiter(120, 60), mcp: memoryLimiter(600, 60) }
const sessions = {
  async open(id, request, endpoint, env) {
    if (!env?.SSE) return mem.open(id, request, endpoint)
    const stub = env.SSE.get(env.SSE.idFromName(id))
    return stub.fetch(`https://sse/open?endpoint=${encodeURIComponent(endpoint)}`, { signal: request.signal })
  },
  async push(id, msgs, env) {
    if (!env?.SSE) return mem.push(id, msgs)
    const r = await env.SSE.get(env.SSE.idFromName(id)).fetch('https://sse/push', { method: 'POST', body: JSON.stringify(msgs) })
    return r.ok
  },
}
const limiter = async (key, bucket, env) => {
  const b = bucket === 'api' ? env?.RL_API : env?.RL_MCP
  if (b && typeof b.limit === 'function') { try { const { success } = await b.limit({ key }); return { ok: success, reset: 60 } } catch { /* fall back */ } }
  return memLimit[bucket](key)
}

// built once per isolate at startup (global scope), so requests stay inside the free plan's small CPU budget
const handler = makeFetch(buildIndex(data), {
  discovery: { llms, llmsFull, mcpJson }, sessions, limiter,
  // Browsers may call from the site itself; agents and CLI clients send no Origin. ChatGPT/Claude connectors call server-side.
  allowOrigin: (o) => /^https:\/\/(www\.)?(tantrafiles\.xyz|satsang\.digital)$/.test(o) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o) || /^https:\/\/([a-z0-9-]+\.)*(openai\.com|chatgpt\.com|claude\.ai|anthropic\.com)$/.test(o),
})
export default { fetch: (request, env) => handler(request, env) }
