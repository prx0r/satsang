// Featured tradition (owner, 2026-11-04: Trika / Kashmir Shaivism front and centre, no redesign). Reads
// data/wisegraph/featured.json (tools/build-featured.py: curated order, best talks by gold tier, safety filter) and gives:
//   row(el)        the featured row on Watch, above the For You rail: best talks + teachers, series, texts, places as chips
//   pins()         the featured talks For You puts first on a cold start (no taste yet, nothing on your mind, no journal)
//   teachersHTML() a featured strip at the top of the Teachers tab
// Existing classes only (wsec, wsech, rail, fy-card via cardHTML, wtopics, wchip, wgrid/wtile via personTile).
export function createFeatured(d) {
  // d: { esc, byId(id), servable(c), cardHTML(x, compact), bindCards(el), personTile(id, sub), face(id, cls) }
  const { esc } = d
  let F = null, P = null
  function load() { return (P ||= fetch('data/wisegraph/featured.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((j) => (F = j && Array.isArray(j.people) ? j : null)).catch(() => (F = null))) }
  const name = (id) => F?.people.find((p) => p.id === id)?.n || ''
  const short = (id) => name(id).replace(/\s*\(.*\)$/, '')
  // the featured talks in their curated order, playable here; each with an honest why line
  function talks() {
    if (!F) return []
    return F.talks.map((t) => d.byId(t.id)).filter((c) => c && d.servable(c)).map((c) => ({ c, kind: 'feat', why: `Featured: ${F.label.split(' \u00b7 ')[0]} \u00b7 ${short(c.speaker || c.comic)}` }))
  }
  const pins = () => talks().slice(0, F?.foryou_cold || 4)
  function chips() {
    if (!F) return ''
    const row = (k, list) => list.length ? `<p class="eyebrow" style="margin:14px 0 8px">${esc(k)}</p><div class="wtopics">${list.join('')}</div>` : ''
    return row('Teachers and masters', F.people.map((p) => `<a class="wchip" href="#teacher/${esc(p.id)}" title="${esc(p.note || '')}">${esc(p.n)}</a>`)) +
      row('Series', F.series.map((s) => `<a class="wchip" href="${esc(s.href)}">${esc(s.title)}<small>${s.units}</small></a>`)) +
      row('Texts', F.texts.map((t) => `<a class="wchip" href="#teacher/${esc(t.id)}">${esc(t.n)}</a>`)) +
      row('Places', F.places.map((p) => `<a class="wchip" href="#place/${esc(p.id)}" title="${esc(p.city)}">${esc(p.n.split(/\s[\u2014(/]|,\s|:\s/)[0])}</a>`))
  }
  async function row(el) {
    if (!el) return
    await load(); if (!F) { el.innerHTML = ''; return }
    const L = talks()
    el.innerHTML = `<section class="wsec fy-rail fy-feat"><div class="wsech"><h3><span class="gtxt">Featured</span> \u00b7 <a href="#tradition/${esc(F.tradition)}">${esc(F.label)}</a></h3><span class="fy-rail-acts"><a class="hbtn" href="#tradition/${esc(F.tradition)}">The tradition</a><a class="hbtn" href="${esc(F.series[0]?.href || '#series')}">Start the series</a></span></div>
      <p class="muted small">${esc(F.line)}</p>
      ${L.length ? `<div class="rail fy-railrow">${L.map((x) => d.cardHTML(x, true)).join('')}</div>` : ''}${chips()}</section>`
    d.bindCards?.(el)
  }
  function teachersHTML() {
    if (!F) return ''
    return `<section class="wsec" id="tf-featured"><div class="wsech"><h3><span class="gtxt">Featured</span> \u00b7 <a href="#tradition/${esc(F.tradition)}">${esc(F.label)}</a></h3><span class="muted small">${esc(F.line)}</span></div>
      <div class="wgrid big">${F.people.map((p) => d.personTile(p.id, p.note)).join('')}</div></section>`
  }
  return { load, ready: () => !!F, data: () => F, talks, pins, row, teachersHTML }
}
