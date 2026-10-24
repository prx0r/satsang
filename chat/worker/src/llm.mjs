// Optional LLM provider for the curator. OFF by default: the curator is fully deterministic without it.
// Target: Qwen via Alibaba Cloud Model Studio's OpenAI-compatible endpoint (the user's approved in-app model family).
// It is used for ONE thing only: re-wording the pack's prose from the pack's own facts. It never chooses, adds or renames items,
// never sees the catalog beyond the pack, and its output is checked (no URLs, no titles or names that are not in the pack, length cap);
// on any failure the templated prose stands.
//
// Switch on (only with the user's approval, since it spends Model Studio credit):
//   wrangler secret put QWEN_API_KEY            (Model Studio API key; never in code, logs or the browser)
//   vars: LLM_PROVIDER = "qwen"                  (default "off")
//         QWEN_MODEL   = "<approved Qwen model id>"  (default below; set the exact approved id)
//         QWEN_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"  (Singapore; Beijing: dashscope.aliyuncs.com)
//         LLM_MAX_TOKENS = "260"  (hard ceiling 400)   LLM_DAILY_CALLS = "300" (per isolate safety valve; the real cap is the Model Studio budget)

const DEFAULT_BASE = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
const DEFAULT_MODEL = 'qwen-flash'
let calls = 0, day = ''

export function createLLM(env = {}) {
  if (String(env.LLM_PROVIDER || 'off').toLowerCase() !== 'qwen' || !env.QWEN_API_KEY) return null
  const base = String(env.QWEN_BASE_URL || DEFAULT_BASE).replace(/\/$/, ''), model = env.QWEN_MODEL || DEFAULT_MODEL
  const maxTokens = Math.max(64, Math.min(400, Number(env.LLM_MAX_TOKENS) || 260)), dailyCap = Math.max(0, Number(env.LLM_DAILY_CALLS) || 300)
  return {
    name: 'qwen', model,
    // yields text deltas; throws on any failure (the caller falls back to the templated prose)
    async *rewordProse(pack) {
      const today = new Date().toISOString().slice(0, 10); if (today !== day) { day = today; calls = 0 }
      if (++calls > dailyCap) throw new Error('llm_daily_cap')
      const facts = {
        ask: pack.ask, title: pack.title,
        steps: pack.steps.map((s) => ({ day: s.day, role: s.role, title: s.title, by: s.by, minutes: s.minutes, why: s.why, orientationOnly: !!s.orientationOnly })),
        deeper: pack.deeper.map((d) => ({ role: d.role, title: d.title, where: d.by })),
        safetyNotes: pack.safety?.notes || [],
      }
      const r = await fetch(`${base}/chat/completions`, {
        method: 'POST', headers: { authorization: `Bearer ${env.QWEN_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model, stream: true, max_tokens: maxTokens, temperature: 0.4,
          messages: [
            { role: 'system', content: 'You write the short introduction to a personal study path on Satsang, a directory of the wisdom traditions. Use ONLY the facts in the JSON. Never add a talk, book, teacher, place, URL, quote, teaching or promise that is not in it. Plain, calm English, at most 110 words, no lists, no headings. Keep every safety note\'s meaning; never suggest breath retention, forceful breathing or raising kundalini; orientation-only practices are to be read about, not attempted alone.' },
            { role: 'user', content: JSON.stringify(facts) },
          ] }),
      })
      if (!r.ok || !r.body) throw new Error(`llm_http_${r.status}`)
      const rd = r.body.getReader(), dec = new TextDecoder(); let buf = ''
      while (true) {
        const { value, done } = await rd.read(); if (done) break
        buf += dec.decode(value, { stream: true })
        let i; while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
          if (!line.startsWith('data:')) continue
          const d = line.slice(5).trim(); if (d === '[DONE]') return
          try { const t = JSON.parse(d).choices?.[0]?.delta?.content; if (t) yield t } catch {}
        }
      }
    },
  }
}

// Reject model prose that strays from the pack: URLs, too long, or capitalised names/titles that the pack does not contain.
export function proseOK(text, pack) {
  const t = String(text || '').trim()
  if (t.length < 40 || t.length > 900 || /https?:\/\/|www\./i.test(t)) return false
  if (/\b(hold (your|the) breath|retention|kumbhaka|kundalini)\b/i.test(t) && !(pack.safety?.notes || []).some((n) => /retention|kundalini/i.test(n))) return false
  const known = [pack.title, pack.ask, ...pack.steps.flatMap((s) => [s.title, s.by, s.why, s.tradition]), ...pack.deeper.flatMap((d) => [d.title, d.by, d.why, d.tradition]), ...(pack.safety?.notes || [])].join(' ').toLowerCase()
  const names = t.match(/\b[A-Z][a-zā-ž]+(?:\s+[A-Z][a-zā-ž]+)+/g) || []
  return names.every((n) => known.includes(n.toLowerCase()) || /^(Satsang|Each Day|Start|Then|Day)/.test(n))
}
