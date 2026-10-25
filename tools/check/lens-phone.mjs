// Enquiry-lens phone check (390x844): for each query and tab, open the live site with ?q=, click the tab, and record
// horizontal overflow, page errors, the panel's sections, the metadata/moment labels, held teachers, and a screenshot.
// usage: node tools/check/lens-phone.mjs [out dir=shots-lens] [q1|q2...]   BASE=https://tantrafiles.xyz  DEV=phone|desktop
// Needs: sh tools/shots/shot-setup.sh
import { createRequire } from 'module'
import fs from 'fs'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const OUT = process.argv[2] || 'shots-lens', BASE = process.env.BASE || 'https://tantrafiles.xyz', DEV = process.env.DEV || 'phone'
const QS = (process.argv[3] || 'fear of death|middle pillar').split('|')
const TABS = (process.env.TABS || 'flash,topics,comics,places,col,ask').split(',')
const HELD = ['Ajahn Sucitto', 'Jack Kornfield', 'Swami Ramdev', 'Yogi Bhajan', 'Taizan Maezumi', 'Sogyal Rinpoche', 'Swami Vishnudevananda', 'Swami Rama']
fs.mkdirSync(OUT, { recursive: true })
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox', '--no-proxy-server', '--mute-audio', '--disable-gpu'] })
const page = await b.newPage()
await page.setViewport(DEV === 'phone' ? { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true } : { width: 1366, height: 900 })
const errs = []; page.on('pageerror', (e) => errs.push(String(e.message || e).slice(0, 200)))
await page.setRequestInterception(true)
page.on('request', (r) => (/googlevideo|youtube(-nocookie)?\.com\/(embed|api|s\/|iframe_api|youtubei)|doubleclick/.test(r.url()) ? r.abort() : r.continue()))
const res = []
for (const q of QS) {
  await page.goto(`${BASE}/?q=${encodeURIComponent(q)}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => document.querySelector('.lens-panel .lens-sec, .lens-panel .lens-note'), { timeout: 45000 }).catch(() => {})
  for (const t of TABS) {
    const n0 = errs.length
    if (t === 'ask') await page.evaluate(() => document.querySelector('.ask-navlink')?.click())
    else await page.evaluate((t) => document.querySelector(`nav [data-tab="${t}"]`)?.click(), t)
    await new Promise((r) => setTimeout(r, t === 'places' || t === 'ask' ? 2600 : 1400))
    const r = await page.evaluate((HELD) => {
      const view = document.querySelector('main > section.view:not([hidden])'), panel = view?.querySelector('.lens-panel')
      const txt = (panel?.innerText || '') + ' ' + (t => t)('')
      return { view: view?.id, bar: !!document.querySelector('#lensbar .lens-q, #lensbar .lens-form'), barText: document.querySelector('#lensbar')?.innerText.slice(0, 80),
        overflow: document.documentElement.scrollWidth - innerWidth, panelOverflow: panel ? panel.scrollWidth - panel.clientWidth : null,
        sections: [...(panel?.querySelectorAll('.lens-sec h3') || [])].map((h) => h.textContent), note: panel?.querySelector('.lens-note')?.textContent || '',
        meta: panel?.querySelectorAll('.lens-kind.meta').length || 0, moments: panel?.querySelectorAll('.lens-kind.moment').length || 0,
        held: HELD.filter((h) => txt.includes(h)), hash: location.hash, askLog: document.querySelector('#v-ask .ask-log')?.innerText.slice(0, 120) || '' }
    }, HELD)
    r.q = q; r.tab = t; r.errors = errs.slice(n0)
    await page.screenshot({ path: `${OUT}/${DEV}-${q.replace(/\W+/g, '-')}-${t}.jpg`, type: 'jpeg', quality: 70, fullPage: false })
    res.push(r); console.log(JSON.stringify(r))
  }
}
fs.writeFileSync(`${OUT}/${DEV}-report.json`, JSON.stringify(res, null, 1))
await b.close()
