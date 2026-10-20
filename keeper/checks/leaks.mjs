// Leak guards over the public bundle (live site HTML, app.js, clips.json, the open-data dump, discovery files) and every
// file tracked in the repo: no transcript text/fields, no secrets, no R2 URLs. With KEEPER_TRANSCRIPTS set (a local
// folder of internal transcripts) it also samples 9-word runs and fails if any appears in the public text.
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { ROOT } from '../lib/util.mjs'
const SECRETS = [
  ['aws-key', /\bAKIA[0-9A-Z]{16}\b/],
  ['github-token', /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['openai-key', /\bsk-(proj-)?[A-Za-z0-9_-]{32,}\b/],
  ['anthropic-key', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['slack-token', /\bxox[abpors]-[A-Za-z0-9-]{10,}/],
  ['google-key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['private-key', /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/],
  ['cloudflare-token-assignment', /\b(CLOUDFLARE_API_TOKEN|CF_API_TOKEN)\s*[=:]\s*["']?[A-Za-z0-9_-]{30,}/],
  ['generic-secret-assignment', /\b(api[_-]?key|client[_-]?secret|auth[_-]?token|password)\b["']?\s*[:=]\s*["'][A-Za-z0-9_\-+/]{24,}["']/i],
]
const R2 = /[a-z0-9-]+\.r2\.cloudflarestorage\.com|pub-[a-f0-9]{32}\.r2\.dev|\.r2\.dev\//i
const TRANSCRIPT = /transcript_?url|transcripts-internal|"transcript"\s*:\s*"|transcriptText|"transcript"\s*:\s*\{/i
export default {
  id: 'leaks', cadence: 'daily', full: true,
  doc: 'Something private reached a public surface. Remove it at the source, rotate any secret immediately (the user does that; tell them), rebuild, and make sure deploy.sh guards still pass. Transcripts are internal only; never publish transcript text or URLs.',
  async run(ctx) {
    const { cfg, http } = ctx
    const F = [], texts = []
    const scan = (where, text) => {
      if (!text) return
      for (const [name, re] of SECRETS) { const m = text.match(re); if (m) F.push({ target: where, key: 'secret:' + name, severity: 'error', message: `Possible ${name} in ${where}`, evidence: { sample: m[0].slice(0, 6) + '…(redacted)' } }) }
      const r2 = text.match(R2); if (r2) F.push({ target: where, key: 'r2', severity: 'error', message: `R2 URL in ${where}`, evidence: { sample: r2[0] } })
      const tr = text.match(TRANSCRIPT); if (tr) F.push({ target: where, key: 'transcript-field', severity: 'error', message: `Transcript field or path in ${where}`, evidence: { sample: tr[0] } })
    }
    // public bundle
    const home = await http.req(cfg.base + '/', { politeness: false })
    const assets = [...new Set([...(home.text || '').matchAll(/(?:src|href)=["'](\/?[^"'#]+\.(?:js|css|json)(?:\?[^"']*)?)["']/g)].map((m) => new URL(m[1], cfg.base + '/').toString()))].filter((u) => new URL(u).host === cfg.host)
    const pub = [cfg.base + '/', ...assets, cfg.base + '/clips.json', cfg.base + '/data/clip.json', cfg.base + '/data/person.json', cfg.base + '/data/place.json', cfg.base + '/llms.txt', cfg.base + '/llms-full.txt', cfg.base + '/.well-known/mcp.json', cfg.mcp + '/openapi.json', cfg.mcp + '/llms-full.txt']
    for (const u of pub) { const r = u === cfg.base + '/' ? home : await http.req(u, { politeness: false, timeout: 60000 }); if (r.ok) { scan(u, r.text); texts.push(r.text) } }
    // clip records: transcript must be a boolean only
    try { const clips = JSON.parse(texts.find((t) => t.startsWith('[{"id"')) || '[]'); const bad = clips.filter((c) => 'transcript' in c && typeof c.transcript !== 'boolean'); if (bad.length) F.push({ target: cfg.base + '/clips.json', key: 'transcript-nonbool', severity: 'error', message: `${bad.length} clips carry a non-boolean transcript field`, evidence: { ids: bad.slice(0, 5).map((c) => c.id) } }) } catch { /* not parseable here */ }
    // repo files (tracked), skipping keeper itself (it holds these patterns)
    let files = []
    try { files = execSync('git ls-files', { cwd: ROOT, maxBuffer: 64 << 20 }).toString().split('\n').filter(Boolean) } catch { /* not a git checkout */ }
    let scanned = 0
    for (const f of files) {
      if (/^keeper\/|\.(png|jpe?g|gif|webp|ico|woff2?|pdf|mp3|mp4|zip|tgz|gz)$/i.test(f)) continue
      const full = path.join(ROOT, f); let st; try { st = fs.statSync(full) } catch { continue }
      if (st.size > 30e6) continue
      const t = fs.readFileSync(full, 'utf8'); scanned++
      for (const [name, re] of SECRETS) { const m = t.match(re); if (m) F.push({ target: 'repo:' + f, key: 'secret:' + name, severity: 'error', message: `Possible ${name} in repo file ${f}`, evidence: { sample: m[0].slice(0, 6) + '…(redacted)' } }) }
      const r2 = t.match(R2); if (r2) F.push({ target: 'repo:' + f, key: 'r2', severity: 'error', message: `R2 URL in repo file ${f}`, evidence: { sample: r2[0] } })
      if (/(^|\/)transcripts?-internal\//.test(f) || /\.(vtt|srt)$/.test(f)) F.push({ target: 'repo:' + f, key: 'transcript-file', severity: 'error', message: `Transcript file tracked in the public repo: ${f}` })
      else if (/\.(json|jsonl|js|mjs)$/.test(f) && /transcript_?url\s*["']?\s*:/i.test(t)) F.push({ target: 'repo:' + f, key: 'transcript-url', severity: 'error', message: `transcript_url field in repo file ${f}` })
    }
    // optional 9-gram sampling against internal transcripts (local only; never in CI)
    let grams = 0
    const tdir = process.env.KEEPER_TRANSCRIPTS
    if (tdir && fs.existsSync(tdir)) {
      const hay = texts.join('\n').toLowerCase().replace(/\s+/g, ' ')
      const tf = fs.readdirSync(tdir).filter((f) => /\.(txt|vtt|json|srt)$/.test(f))
      for (const f of tf.sort(() => Math.random() - 0.5).slice(0, 60)) {
        const words = fs.readFileSync(path.join(tdir, f), 'utf8').replace(/<[^>]+>|\d\d:\d\d[:.\d\s>-]*/g, ' ').toLowerCase().split(/\s+/).filter((w) => /[a-z]/.test(w))
        for (let k = 0; k < 5 && words.length > 40; k++) { const i = Math.floor(Math.random() * (words.length - 9)); const g = words.slice(i, i + 9).join(' '); grams++; if (g.length > 40 && hay.includes(g)) { F.push({ target: 'transcript:' + f, key: 'ngram', severity: 'error', message: `A 9-word run from internal transcript ${f} appears in the public bundle` }); break } }
      }
    }
    return { findings: F, passed: [], full: true, checked: pub.length + scanned, grams }
  },
}
