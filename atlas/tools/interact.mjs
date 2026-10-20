// Interaction smoke test for the atlas prototype: every visible control must do something.
import { createRequire } from 'module'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const DIR = new URL('..', import.meta.url).pathname
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox'] })
const p = await b.newPage(); await p.setRequestInterception(true); p.on('request', r => /^file:/.test(r.url()) ? r.continue() : r.abort())
const errs = []; p.on('pageerror', e => errs.push(e.message))
await p.setViewport({ width: 1440, height: 900 })
await p.goto('file://' + DIR + 'proto/index.html', { waitUntil: 'load' })
await new Promise(r => setTimeout(r, 600))
const res = {}
const centre = async sel => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] }, sel)
const wait = ms => new Promise(r => setTimeout(r, ms))
// 1 hover node -> lineage highlight
let c = await centre('.node[aria-label="Marpa Lotsāwa"]'); await p.mouse.move(c[0], c[1]); await wait(300)
res.hoverNode = await p.evaluate(() => ({ dim: document.querySelector('#svg').classList.contains('dim'), lit: document.querySelectorAll('.node.hl').length, edges: document.querySelectorAll('.edge.hl').length, tip: getComputedStyle(document.querySelector('#tip')).display }))
await p.mouse.move(5, 300); await wait(300)
res.hoverOut = await p.evaluate(() => document.querySelector('#svg').classList.contains('dim'))
// 2 click a label -> panel
c = await centre('.nlab.big'); const labName = await p.evaluate(() => document.querySelector('.nlab.big').textContent)
await p.mouse.click(c[0], c[1]); await wait(500)
res.clickLabel = await p.evaluate(n => ({ want: n, open: document.querySelector('#panel').classList.contains('open'), title: document.querySelector('#panel h2')?.textContent, links: document.querySelectorAll('#panel a.n').length }), labName)
// 3 click a panel link -> navigates
await p.evaluate(() => document.querySelector('#panel li a.n').click()); await wait(500)
res.panelLink = await p.evaluate(() => document.querySelector('#panel h2')?.textContent)
// 4 edge hit hover + click
const hc = await p.evaluate(() => { for (const h of document.querySelectorAll('.ehit')) { if (!h.getAttribute('d')) continue; const L = h.getTotalLength(); const pt = h.getPointAtLength(L / 2); const m = h.getScreenCTM(); const x = pt.x * m.a + m.e, y = pt.y * m.d + m.f; if (y < 140 || y > 880 || x < 160 || x > 1400) continue; if (document.elementFromPoint(x, y) === h) return [x, y] } return null })
if (hc) { await p.mouse.move(hc[0], hc[1]); await wait(150); res.edgeTip = await p.evaluate(() => document.querySelector('#tip').textContent.slice(0, 80)); await p.mouse.click(hc[0], hc[1]); await wait(300); res.edgePanel = await p.evaluate(() => document.querySelector('#panel .k')?.textContent) }
// 5 lane label -> lane panel, solo button
await p.evaluate(() => document.querySelector('#close').click()); await wait(200)
await p.evaluate(() => document.querySelector('#stage').scrollTo(0, 0)); await wait(100)
c = await centre('g.lane'); await p.mouse.click(c[0], c[1]); await wait(300)
res.lane = await p.evaluate(() => document.querySelector('#panel h2')?.textContent)
await p.evaluate(() => document.querySelector('#panel button[data-solo]').click()); await wait(400)
res.solo = await p.evaluate(() => document.querySelectorAll('g.lane').length)
await p.evaluate(() => document.querySelector('#panel button[data-solo]').click()); await wait(400)
res.unsolo = await p.evaluate(() => document.querySelectorAll('g.lane').length)
// 6 legend: kind toggle + edge highlight
await p.evaluate(() => document.querySelector('#keyBtn').click()); await wait(100)
const before = await p.evaluate(() => document.querySelectorAll('.node').length)
await p.evaluate(() => document.querySelector('#legend button[data-kind="text"]').click()); await wait(300)
res.kindToggle = [before, await p.evaluate(() => document.querySelectorAll('.node').length)]
await p.evaluate(() => document.querySelector('#legend button[data-kind="text"]').click()); await wait(300)
await p.evaluate(() => document.querySelector('#legend button[data-edge="tx"]').click()); await wait(300)
res.edgeFocus = await p.evaluate(() => document.querySelectorAll('.edge.hl').length)
await p.evaluate(() => document.querySelector('#legend button[data-edge="tx"]').click()); await wait(200)
// 7 concept chip -> thread, click thread -> concept panel
await p.evaluate(() => [...document.querySelectorAll('.chip.concept')].find(x => /Rebirth/.test(x.textContent)).click()); await wait(400)
const tc = await p.evaluate(() => { const h = document.querySelector('.thread'); if (!h) return null; h.scrollIntoView({ block: 'center' }); const L = h.getTotalLength(); const pt = h.getPointAtLength(L * .3); const m = h.getScreenCTM(); return [pt.x * m.a + m.e, pt.y * m.d + m.f] })
if (tc) { await p.mouse.click(tc[0], tc[1]); await wait(300) }
res.thread = await p.evaluate(() => ({ threads: document.querySelectorAll('.thread').length, panel: document.querySelector('#panel h2')?.textContent, info: document.querySelector('#threadinfo').textContent }))
// 8 group label solo, zoom buttons, scale, search
await p.evaluate(() => document.querySelector('.grouplab').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await wait(300)
res.groupSolo = await p.evaluate(() => document.querySelectorAll('g.lane').length)
const v0 = await p.evaluate(() => atlas.view.join()); await p.evaluate(() => document.querySelector('#zin').click()); res.zoom = v0 !== await p.evaluate(() => atlas.view.join())
await p.type('#q', 'Corbin'); await wait(400); await p.keyboard.press('Enter'); await wait(500)
res.search = await p.evaluate(() => document.querySelector('#panel h2')?.textContent)
console.log(JSON.stringify(res, null, 1)); console.log(errs.length ? 'ERRORS ' + errs.join(' | ') : 'no page errors')
await b.close()
