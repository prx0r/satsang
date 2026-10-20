// Stage 7a · narration audio. Fish Audio TTS per narration line (cached by hash of model|voice|speed|text), silence-trimmed,
// encoded for the web, then measured (duration) and aligned (word timestamps via align.py). Browser speechSynthesis stays the fallback.
// usage: node tools/media/tts.mjs <pipeline dir> [--voice <fish reference id>] [--speed 0.85]
// env FISH_API_KEY (the sandbox gateway also supplies it). Never a real teacher's voice: see VOICE below.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { ENGINE, readJSON, writeJSON } from '../extract/lib.mjs'
export const VOICE = { provider: 'fish', model: 's2.1-pro-free', id: '8d797adca9af48ca9e8a1c7284db1d6c', title: 'meditation (Fish public library)',
  description: 'a soothing middle-aged male voice, deep and warm (library description)', policy: 'generic library voice, not named after or cloned from any teacher; chosen by the agent, pending the user\'s approval (PRACTICE-MEDIA §5)' }
const a = process.argv.slice(2), flag = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d }
const dir = path.resolve(a[0]), nar = readJSON(path.join(dir, 'narration.json')), id = nar.practice
const voice = flag('--voice', VOICE.id), speed = +flag('--speed', 0.85)
const out = path.join(ENGINE, 'renders', id, 'voice'), cache = path.join(out, 'wav'); fs.mkdirSync(cache, { recursive: true })
// spoken form: captions keep typography; speech drops quote marks and turns ellipses into a short pause
export const spoken = s => s.replace(/[“”"]/g, '').replace(/\s*…\s*/g, ', ').replace(/^,\s*/, '').replace(/,\s*$/, '.').replace(/,\s*\./g, '.').trim()
const key = t => crypto.createHash('sha1').update(`${VOICE.model}|${voice}|${speed}|${t}`).digest('hex').slice(0, 16)
const sh = (c, args, o = {}) => execFileSync(c, args, { encoding: 'utf8', maxBuffer: 1 << 26, ...o })
function fish(text, f) {
  if (fs.existsSync(f) && fs.statSync(f).size > 2000) return 'cache'
  const body = path.join(cache, 'req.json'); fs.writeFileSync(body, JSON.stringify({ text, format: 'wav', reference_id: voice, normalize: true, latency: 'normal', prosody: { speed } }))
  for (let att = 0; att < 3; att++) { // at most three tries, then stop (never loop)
    try {
      sh('curl', ['-sf', '--max-time', '180', 'https://api.fish.audio/v1/tts', '-H', `Authorization: Bearer ${process.env.FISH_API_KEY || ''}`, '-H', 'content-type: application/json', '-H', `model: ${VOICE.model}`, '--data-binary', '@' + body, '-o', f + '.tmp'])
      if (fs.statSync(f + '.tmp').size < 2000) throw new Error('short body')
      fs.renameSync(f + '.tmp', f); return 'fish'
    } catch (e) { if (att === 2) throw new Error(`Fish failed for “${text.slice(0, 40)}”: ${e.message}`); sh('sleep', [String(3 * 2 ** att)]) }
  }
}
const prev = fs.existsSync(path.join(out, 'manifest.json')) ? new Map(readJSON(path.join(out, 'manifest.json')).lines.map(l => [l.key, l])) : new Map()
const lines = []
for (const ln of nar.lines) {
  const text = spoken(ln.say || ln.text), k = key(text), raw = path.join(cache, k + '.wav'), trimmed = path.join(cache, k + '.trim.wav'), mp3 = path.join(out, k + '.mp3')
  const how = fish(text, raw)
  if (!fs.existsSync(trimmed)) sh('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-af', 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.12,areverse', '-ac', '1', '-ar', '44100', trimmed])
  if (!fs.existsSync(mp3)) sh('ffmpeg', ['-v', 'error', '-y', '-i', trimmed, '-ac', '1', '-ar', '22050', '-b:a', '40k', mp3])
  const dur = +sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', trimmed]).trim()
  lines.push({ id: ln.id, text: ln.text, spoken: text, key: k, file: `renders/${id}/voice/${k}.mp3`, dur_s: Math.round(dur * 1000) / 1000, via: how, ...Object.fromEntries(['words', 'heard', 'match', 'align_key'].map(f => [f, prev.get(k)?.[f]]).filter(([, v]) => v !== undefined)) })
  console.log(ln.id, how, dur.toFixed(2) + 's', text)
}
// drop clips no line uses any more
for (const f of fs.readdirSync(out)) if (f.endsWith('.mp3') && !lines.some(l => l.key + '.mp3' === f)) fs.rmSync(path.join(out, f))
writeJSON(path.join(out, 'manifest.json'), { type: 'voice_manifest', practice: id, voice: { ...VOICE, id: voice, speed }, created: new Date().toISOString().slice(0, 10), lines })
console.log(`manifest: ${lines.length} lines, ${lines.reduce((s, l) => s + l.dur_s, 0).toFixed(1)} s of speech`)
