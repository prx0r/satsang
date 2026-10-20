// Resources = anything a person can read or study from: Satsang text records (free editions linked, never rehosted), the free
// texts listed on people (wise.json `texts`), free libraries listed on places, people's published works (books: access not
// known to be free), and any site/data/wisegraph/resources*.json merged later (data.resourceExtra). Shared by the MCP
// (src/agents.mjs) and the site's /resource/<id> pages (app/web-worker/build-meta.mjs), so both use the same ids.
export const slugify = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72)
export const dateOf = (s) => (String(s || '').match(/\d{4}-\d{2}-\d{2}/) || [null])[0]

export function buildResources(data) {
  const out = {}, byUrl = new Map()
  const built = dateOf(data.meta?.built), peopleDate = dateOf(data.meta?.sources?.people) || built
  const add = (r) => {
    if (r.url && byUrl.has(r.url)) { // same link listed twice: merge people/traditions, keep the first id
      const o = out[byUrl.get(r.url)]
      for (const k of ['authors', 'traditions', 'topics', 'places']) o[k] = [...new Set([...(o[k] || []), ...(r[k] || [])])]
      return
    }
    let id = slugify(r.id || r.title) || 'resource', n = 2
    while (out[id]) id = `${slugify(r.id || r.title).slice(0, 66)}-${n++}`
    out[id] = { ...r, id }
    if (r.url) byUrl.set(r.url, id)
  }
  for (const t of Object.values(data.text || {})) {
    const ed = (t.editions || []).find((e) => e.url) || null
    add({ id: t.id, title: t.title, kind: t.kind || 'text', url: ed?.url || null, free: ed ? ed.free !== false : null,
      access: ed ? (ed.free !== false ? 'free' : 'paid-or-unknown') : 'no-link', licence: ed?.licence, publisher: ed?.publisher,
      authors: t.authors || [], authorName: t.authorName, traditions: t.traditions || [], topics: t.topics || [], summary: t.summary,
      sourceUrl: ed?.url || (t.ids?.wikidata ? `https://www.wikidata.org/wiki/${t.ids.wikidata}` : null), verifiedOn: built,
      confidence: ed ? 'high' : 'medium', origin: 'text' })
  }
  for (const p of Object.values(data.person || {})) for (const x of p.freeTexts || []) add({
    title: x.title, kind: 'text', url: x.url, free: x.free !== false, access: x.free !== false ? 'free' : 'paid-or-unknown', licence: x.licence, ...(x.licenceUrl ? { licenceUrl: x.licenceUrl } : {}), publisher: x.site,
    authors: [p.id], authorName: p.name, traditions: p.traditions || [], topics: [], sourceUrl: x.url, verifiedOn: peopleDate, confidence: 'high', origin: 'person' })
  for (const pl of Object.values(data.place || {})) for (const x of pl.resources || []) add({
    title: x.title, kind: 'library', url: x.url, free: x.free === true, access: x.free === true ? 'free' : 'paid-or-unknown', licence: x.licence, ...(x.licenceClass ? { licenceClass: x.licenceClass } : {}), ...(x.licenceUrl ? { licenceUrl: x.licenceUrl } : {}),
    authors: [], places: [pl.id], traditions: pl.traditions || [], topics: [], sourceUrl: x.sourceUrl || x.url, verifiedOn: dateOf(x.checked) || dateOf(pl.meta?.updated) || built,
    confidence: x.checked ? 'high' : 'medium', origin: 'place' })
  for (const x of data.resourceExtra || []) add({
    title: x.title, kind: x.kind || 'text', url: x.url, free: x.free === true, access: x.free === true ? 'free' : x.free === false ? 'paid' : 'paid-or-unknown', licence: x.licence,
    ...(x.licenceUrl ? { licenceUrl: x.licenceUrl } : {}), ...(x.licenceClass ? { licenceClass: x.licenceClass, ...(x.noSale ? { terms: 'Free to read and share unchanged; not for sale (licence on the book\u2019s copyright page).' } : {}) } : {}),
    authors: x.people || [], traditions: x.traditions || [], topics: [], sourceUrl: x.sourceUrl || x.url, verifiedOn: dateOf(x.checked) || built, confidence: x.checked ? 'high' : 'medium', origin: 'extra' })
  for (const p of Object.values(data.person || {})) for (const w of p.works || []) {
    if (!w.title) continue
    add({ id: w.id ? `${w.id}` : `${p.id}-${w.title}`, title: w.title, kind: w.kind || 'work', url: null, free: null, access: 'paid-or-unknown', year: w.year ?? undefined,
      authors: [p.id], authorName: p.name, traditions: p.traditions || [], topics: [], sourceUrl: (p.links || []).find((l) => l.kind === 'official')?.url || (p.ids?.wikidata ? `https://www.wikidata.org/wiki/${p.ids.wikidata}` : null),
      verifiedOn: peopleDate, confidence: 'medium', origin: 'work', note: 'Listed as a published work; not known to be free. Check the publisher or the author\u2019s site.' })
  }
  return out
}
