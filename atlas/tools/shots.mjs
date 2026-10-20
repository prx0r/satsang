// Screenshot the atlas prototype (file://, offline except Google Fonts). usage: node tools/shots.mjs [tag]
import { createRequire } from 'module'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const DIR = new URL('..', import.meta.url).pathname
const URL0 = 'file://' + DIR + 'proto/index.html'
const url = h => h.startsWith('?') ? URL0 + h : URL0 + h
const tag = process.argv[2] || ''
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] })
const shots = [
  ['desktop-full', { width: 1440, height: 900 }, ''],
  ['desktop-trika', { width: 1440, height: 900 }, '#atlas/abhinavagupta'],
  ['desktop-thread-rebirth', { width: 1440, height: 900 }, '#atlas/thread=c-rebirth'],
  ['desktop-corbin', { width: 1440, height: 900 }, '#atlas/henry-corbin'],
  ['desktop-occult', { width: 1440, height: 900 }, '#atlas/golden-dawn'],
  ['desktop-merged-thai-forest', { width: 1440, height: 900 }, '?merged#atlas/ajahn-chah'],
  ['phone-full', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, ''],
  ['phone-milarepa', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, '#atlas/milarepa'],
  ['phone-thread-nonduality', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, '#atlas/thread=c-nonduality'],
]
const errs = []
for (const [name, vp, hash] of shots) {
  if (process.argv[3] && !name.includes(process.argv[3])) continue
  const p = await b.newPage()
  await p.setRequestInterception(true)
  p.on('request', r => /^file:/.test(r.url()) ? r.continue() : r.abort())  // web fonts unreachable in the sandbox: fallback fonts
  p.on('pageerror', e => errs.push(name + ': ' + e.message))
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(name + ' console: ' + m.text()) })
  await p.setViewport(vp)
  await p.goto(URL0 + hash, { waitUntil: 'load', timeout: 30000 }).catch(e => errs.push('goto ' + e.message))
  await new Promise(r => setTimeout(r, 900))
  if (name === 'desktop-full' || name === 'phone-full') {
    const o = await p.evaluate(() => { const s = document.documentElement; return { sw: s.scrollWidth, cw: s.clientWidth, h: document.querySelector('#svg').getAttribute('height') } })
    console.log(name, JSON.stringify(o))
  }
  await p.screenshot({ path: `${DIR}shots/${name}${tag}.png` })
  await p.close()
}
await b.close()
console.log(errs.length ? errs.join('\n') : 'no page errors')
