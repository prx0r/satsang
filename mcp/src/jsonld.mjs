// schema.org JSON-LD for each Wiser entity kind (see ../../specs/DATA-MODEL.md §6). Pure mapping; used by build-dump.mjs and,
// later, by the site to inject <script type="application/ld+json"> on each page.
const SITE = 'https://tantrafiles.xyz'
export const idUrl = (kind, id) => `${SITE}/${kind === 'text' ? 'resource' : kind}/${kind === 'clip' ? encodeURIComponent(id) : id}`
const sameAs = (ids) => ids?.wikidata ? [`https://www.wikidata.org/wiki/${ids.wikidata}`] : undefined
const iso = (sec) => { if (!sec) return undefined; const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return `PT${h ? h + 'H' : ''}${m ? m + 'M' : ''}${s ? s + 'S' : ''}` || 'PT0S' }
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/'
const yr = (y) => (y == null ? undefined : y < 0 ? `-${String(-y).padStart(4, '0')}` : String(y).padStart(4, '0'))

export function toJsonLd(kind, r, data) {
  const base = { '@id': idUrl(kind, r.id), url: idUrl(kind, r.id) }
  switch (kind) {
    case 'person': return { '@type': 'Person', ...base, name: r.name, alternateName: r.short, description: r.bio, sameAs: sameAs(r.ids),
      image: r.image?.src, birthDate: yr(r.years?.start), deathDate: r.living ? undefined : yr(r.years?.end),
      knowsAbout: r.traditions.map((t) => ({ '@id': idUrl('tradition', t) })), hasOccupation: r.roles.includes('scholar') ? { '@type': 'Occupation', name: 'Scholar' } : undefined }
    case 'tradition': return { '@type': 'DefinedTerm', ...base, name: r.label, description: r.blurb, inDefinedTermSet: `${SITE}/tradition/`, termCode: r.id, sameAs: sameAs(r.ids),
      broader: r.parent ? { '@id': idUrl('tradition', r.parent) } : undefined }
    case 'clip': {
      const vid = r.media.videoId
      const v = { '@type': 'VideoObject', ...base, name: r.title, description: r.talk ? `${r.title} (from “${r.talk}”)` : r.title,
        thumbnailUrl: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`, uploadDate: r.published, duration: iso(r.seconds),
        embedUrl: `https://www.youtube-nocookie.com/embed/${vid}${r.media.start != null ? `?start=${r.media.start}&end=${r.media.end}` : ''}`,
        contentUrl: undefined, author: { '@id': idUrl('person', r.speaker) }, about: [...r.topics.map((t) => ({ '@id': idUrl('topic', t.id) })), ...r.figures.map((f) => ({ '@id': idUrl('person', f) }))],
        videoFrameSize: r.orientation.value === 'vertical' ? '1080x1920' : undefined, isAccessibleForFree: true }
      if (r.media.parent) { v['@type'] = ['VideoObject', 'Clip']; v.isPartOf = { '@type': 'VideoObject', '@id': `https://www.youtube.com/watch?v=${vid}`, name: r.talk || r.sourceTitle }; v.startOffset = r.media.start; v.endOffset = r.media.end }
      return v
    }
    case 'text': return { '@type': r.kind === 'book' ? 'Book' : 'CreativeWork', ...base, name: r.title, author: r.authors?.length ? r.authors.map((a) => ({ '@id': idUrl('person', a) })) : r.authorName ? { '@type': 'Person', name: r.authorName } : undefined,
      genre: r.kind, inLanguage: r.lang, sameAs: sameAs(r.ids), workExample: r.editions?.map((e) => ({ '@type': 'CreativeWork', url: e.url, name: e.title, publisher: e.publisher, isAccessibleForFree: !!e.free })) }
    case 'practice': return { '@type': 'HowTo', ...base, name: r.name, description: r.summary, totalTime: r.duration?.default ? `PT${r.duration.default}M` : undefined,
      step: r.steps.map((s) => ({ '@type': 'HowToStep', position: s.n, text: s.text })), isBasedOn: r.sources.map((s) => s.url), about: r.traditions.map((t) => ({ '@id': idUrl('tradition', t) })),
      warning: r.contraindications?.length ? r.contraindications.join(' ') : undefined, license: LICENSE }
    case 'topic': return { '@type': ['DefinedTerm', 'CollectionPage'], ...base, name: r.label, description: r.intro, inDefinedTermSet: `${SITE}/topic/`, termCode: r.id,
      broader: r.parent ? { '@id': idUrl('topic', r.parent) } : undefined, hasPart: (r.questions || []).map((q) => ({ '@type': 'Question', name: q.label, text: q.blurb })), license: LICENSE }
    case 'collection': {
      const items = r.units.flatMap((u) => u.items.map((it) => it.ref.id))
      const list = { '@type': 'ItemList', itemListOrder: r.ordered ? 'https://schema.org/ItemListOrderAscending' : 'https://schema.org/ItemListUnordered',
        itemListElement: items.map((g, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@id': `${SITE}/${g}` } })) }
      if (r.kind === 'journey' || r.kind === 'syllabus') return { '@type': 'Course', ...base, name: r.title, description: r.intro, provider: { '@type': 'Organization', name: 'Wiser', url: SITE },
        hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseSchedule: r.cadence ? { '@type': 'Schedule', repeatFrequency: 'P1D', repeatCount: r.cadence.days } : undefined },
        syllabusSections: r.units.map((u) => ({ '@type': 'Syllabus', name: u.title, description: u.intro })), hasPart: list, license: r.license && LICENSE }
      if (r.kind === 'meditation-series' || r.kind === 'visualisation-cycle') return { '@type': 'CreativeWorkSeries', ...base, name: r.title, description: r.intro, hasPart: list, license: LICENSE }
      return { '@type': ['CreativeWork', 'Collection'], ...base, name: r.title, description: r.intro, hasPart: list, license: LICENSE }
    }
    case 'place': return { '@type': r.placeType === 'centre' || r.placeType === 'retreat' ? 'Place' : 'PlaceOfWorship', ...base, name: r.name, description: r.description,
      geo: r.geo?.lat != null ? { '@type': 'GeoCoordinates', latitude: r.geo.lat, longitude: r.geo.lng } : undefined,
      address: { '@type': 'PostalAddress', addressLocality: r.city, addressCountry: r.country }, sameAs: [r.url, ...(sameAs(r.ids) || [])].filter(Boolean),
      email: r.contact?.email?.[0]?.[0], telephone: r.contact?.phone?.[0]?.[0] }
    case 'event': return { '@type': 'Event', ...base, name: r.name, startDate: r.startsAt || yr(r.when?.start), endDate: r.endsAt, location: r.place ? { '@id': idUrl('place', r.place) } : undefined,
      eventAttendanceMode: r.online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode', performer: r.teachers?.map((t) => ({ '@id': idUrl('person', t) })) }
    case 'edge': return null   // edges are expressed on the Person nodes below, and as raw JSON in the dump
  }
}

// Lineage edges as Person properties (schema.org has no 'teacher' property; we use knows + a typed Role, plus our own vocab).
export function personRelations(person, edges) {
  const rel = []
  for (const e of edges) {
    if (e.src === `person/${person.id}` && e.dst.startsWith('person/')) rel.push({ '@type': 'Role', roleName: e.rel, knows: { '@id': `${SITE}/${e.dst}` } })
  }
  return rel.length ? { knows: rel } : {}
}
