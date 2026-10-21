// Redeploy the engine preview (engine.tantrafiles.xyz, Worker satsang-engine-preview) WITH /talk/ and /rt/ added.
// It does not fork the preview's file list: it runs the owner's tools/deploy-preview.mjs --dry (whatever that ships today),
// then adds talk/ + rt/ text files to the generated worker and uploads it the same way (curl via the credential gateway).
// The Worker custom domain already exists, so only the script is replaced. usage: node talk/deploy-talk.mjs [--dry]
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { execFileSync } from 'node:child_process'
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const ACCOUNT = '954612afb5a97bb15dddcdc70176813d', NAME = 'satsang-engine-preview', DIR = '/tmp/satsang-engine-worker'
execFileSync('node', [path.join(ROOT, 'tools/deploy-preview.mjs'), '--dry'], { stdio: 'inherit', cwd: ROOT })
let w = fs.readFileSync(`${DIR}/worker.js`, 'utf8')
const add = [
  ...['index.html', 'talk.mjs', 'flow.mjs', 'fake-model.mjs'].map(f => `talk/${f}`),
  ...fs.readdirSync(path.join(ROOT, 'rt')).filter(f => f.endsWith('.mjs') && !f.startsWith('test')).map(f => `rt/${f}`), 'rt/README.md',
]
const TYPES = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.md': 'text/markdown; charset=utf-8' }
const lines = w.split('\n'), li = lines.findIndex(l => l.startsWith('const A = ') && l.endsWith(';'))
if (li < 0) throw new Error('generated worker changed shape: the one-line const A = {...}; was not found')
const A = JSON.parse(lines[li].slice('const A = '.length, -1))
for (const f of add) A['/' + f] = [TYPES[path.extname(f)], fs.readFileSync(path.join(ROOT, f), 'utf8')]
// imports the page needs must be shipped by the owner's list too
for (const need of ['/compile.mjs', '/grammar.json', '/player/player.js', '/player/engine.js', '/player/player.css', '/practices/nadi-shodhana-sivananda.json'])
  if (!A[need]) throw new Error(`preview no longer ships ${need}; /talk/ needs it`)
lines[li] = `const A = ${JSON.stringify(A)};`
w = lines.join('\n')
w = w.replace("if (p === '/' || p === '/demo')", "if (p === '/talk') return Response.redirect(u.origin + '/talk/' + u.search, 302);\n  if (p === '/' || p === '/demo')")
fs.writeFileSync(`${DIR}/worker.js`, w)
console.log(`+${add.length} files (talk/, rt/); worker.js ${(w.length / 1024).toFixed(1)} KB`)
if (process.argv.includes('--dry')) process.exit(0)
const bins = [...w.matchAll(/import B\d+ from '\.\/(b\d+\.bin)'/g)].map(x => x[1])   // only the modules this worker imports
fs.writeFileSync(`${DIR}/metadata.json`, JSON.stringify({ main_module: 'worker.js', compatibility_date: '2026-10-01' }))
const curl = (...a) => JSON.parse(execFileSync('curl', ['-s', '--max-time', '110', ...a], { encoding: 'utf8', maxBuffer: 1 << 26 }))
const up = curl('-X', 'PUT', `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/workers/scripts/${NAME}`,
  '-F', `metadata=@${DIR}/metadata.json;type=application/json`,
  '-F', `worker.js=@${DIR}/worker.js;type=application/javascript+module`,
  ...bins.flatMap(b => ['-F', `${b}=@${DIR}/${b};type=application/octet-stream`]))
console.log('upload', up.success, JSON.stringify(up.errors || []), up.result?.etag || '')
process.exitCode = up.success ? 0 : 1
