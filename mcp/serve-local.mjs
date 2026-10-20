#!/usr/bin/env node
// Local dev server: node serve-local.mjs [port]  -> http://127.0.0.1:8799/mcp  (same handler as the Worker)
import http from 'node:http'
import fs from 'node:fs'
import { buildIndex, makeFetch } from './src/core.mjs'
const dir = new URL('.', import.meta.url)
const data = JSON.parse(fs.readFileSync(new URL('data/wiser.json', dir), 'utf8'))
const rdT = (p) => fs.readFileSync(new URL(p, dir), 'utf8')
const fetchH = makeFetch(buildIndex(data), { discovery: { llms: rdT('discovery/llms.txt'), llmsFull: rdT('discovery/llms-full.txt'), mcpJson: JSON.parse(rdT('discovery/mcp.json')) }, allowOrigin: (o) => /localhost|127\.0\.0\.1/.test(o) })
const port = +(process.argv[2] || 8799)
export const server = http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c)
  const ac = new AbortController(); res.on('close', () => ac.abort())
  const r = await fetchH(new Request(`http://127.0.0.1:${port}${req.url}`, { method: req.method, headers: req.headers, signal: ac.signal, body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : Buffer.concat(chunks) }))
  res.writeHead(r.status, Object.fromEntries(r.headers))
  if (!r.body) return res.end()
  const rd = r.body.getReader(); req.on('close', () => rd.cancel().catch(() => {}))
  for (;;) { const { value, done } = await rd.read(); if (done) break; res.write(value) } res.end()
})
server.listen(port, '127.0.0.1', () => console.log(`wiser-mcp on http://127.0.0.1:${port}/mcp`))
