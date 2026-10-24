// REST mirror of the MCP tools (MCP_BASE/api/... from ../../domain.mjs) + its OpenAPI 3.1 description (usable as a Custom GPT
// Action). GET with query parameters; every JSON body is exactly what the matching MCP tool returns.
import { BASE, HOST, MCP_BASE } from '../../domain.mjs'
const csv = (v) => (v == null || v === '' ? undefined : String(v).split(',').map((s) => s.trim()).filter(Boolean))
const num = (v) => (v == null || v === '' ? undefined : Number(v))

const ROUTES = [
  // [regex, tool, (match, query, body) => args]
  [/^\/api\/search$/, 'search', (m, q) => ({ query: q.get('q') || q.get('query') || '', kinds: csv(q.get('kinds')), limit: num(q.get('limit')) })],
  [/^\/api\/fetch$/, 'fetch', (m, q) => ({ id: q.get('id') })],
  [/^\/api\/records\/([a-z]+)\/(.+)$/, 'fetch', (m) => ({ id: `${m[1]}/${m[2]}` })],
  [/^\/api\/places$/, 'find_places', (m, q) => ({ tradition: q.get('tradition') || undefined, school: q.get('school') || undefined, country: q.get('country') || undefined, region: q.get('region') || undefined, type: q.get('type') || undefined, status: q.get('status') || undefined, living_teacher: q.get('living_teacher') || undefined, offers: csv(q.get('offers')), query: q.get('q') || q.get('query') || undefined, limit: num(q.get('limit')) })],
  [/^\/api\/places\/search$/, 'search_places', (m, q) => ({ query: q.get('q') || q.get('query') || undefined, tradition: q.get('tradition') || undefined, school: q.get('school') || undefined, country: q.get('country') || undefined,
    near: q.get('lat') && q.get('lng') ? { lat: num(q.get('lat')), lng: num(q.get('lng')), km: num(q.get('km')) } : undefined, residential: q.get('residential') ?? undefined, online: q.get('online') ?? undefined,
    language: q.get('language') || undefined, has_upcoming_events: q.get('has_upcoming_events') ?? undefined, has_email: q.get('has_email') ?? undefined, limit: num(q.get('limit')) })],
  [/^\/api\/events$/, 'list_events', (m, q) => ({ place: q.get('place') || undefined, tradition: q.get('tradition') || undefined, country: q.get('country') || undefined, from: q.get('from') || undefined, to: q.get('to') || undefined, online: q.get('online') ?? undefined, query: q.get('q') || q.get('query') || undefined, limit: num(q.get('limit')) })],
  [/^\/api\/places\/([^/]+)$/, 'get_place', (m) => ({ id: m[1] })],
  [/^\/api\/teachers$/, 'find_teachers', (m, q) => ({ tradition: q.get('tradition') || undefined, school: q.get('school') || undefined, living: q.get('living') || undefined, country: q.get('country') || undefined, region: q.get('region') || undefined, role: q.get('role') || undefined, on_video: q.get('on_video') || undefined, query: q.get('q') || q.get('query') || undefined, limit: num(q.get('limit')) })],
  [/^\/api\/teachers\/([^/]+)$/, 'get_teacher', (m, q) => ({ id: m[1], talks: num(q.get('talks')) })],
  [/^\/api\/resources$/, 'get_resources', (m, q) => ({ tradition: q.get('tradition') || undefined, person: q.get('person') || undefined, topic: q.get('topic') || undefined, free: q.get('free') || undefined, kind: q.get('kind') || undefined, query: q.get('q') || q.get('query') || undefined, limit: num(q.get('limit')) })],
  [/^\/api\/lineage\/path$/, 'get_lineage_path', (m, q) => ({ from: q.get('from'), to: q.get('to'), lineage: q.get('lineage') || undefined, max_hops: num(q.get('max_hops')) })],
  [/^\/api\/lineage\/(.+)$/, 'get_lineage', (m, q) => ({ id: m[1], direction: q.get('direction') || undefined, lineage: q.get('lineage') || undefined, hops: num(q.get('hops')) })],
  [/^\/api\/study\/(.+)$/, 'what_to_study', (m, q) => ({ tradition: m[1], limit: num(q.get('limit')) })],
  [/^\/api\/topics\/(.+)$/, 'get_topic', (m, q) => ({ id: m[1], talks: num(q.get('talks')) })],
  [/^\/api\/practices$/, 'list_practices', (m, q) => ({ tradition: q.get('tradition') || undefined, kind: q.get('kind') || undefined, topic: q.get('topic') || undefined, limit: num(q.get('limit')) })],
  [/^\/api\/collections$/, 'get_collection', () => ({})],
  [/^\/api\/collections\/([^/]+)$/, 'get_collection', (m) => ({ id: m[1] })],
  [/^\/api\/retreats$/, 'find_retreats', (m, q) => ({ country: q.get('country') || undefined, tradition: q.get('tradition') || undefined, format: q.get('format') || undefined, length: q.get('length') || undefined, query: q.get('q') || q.get('query') || undefined, limit: num(q.get('limit')) })],
  [/^\/api\/schedule\/([^/]+)$/, 'get_schedule', (m) => ({ id: m[1] })],
  [/^\/api\/retreat-plan$/, 'plan_retreat', (m, q) => ({ topic: q.get('topic'), days: num(q.get('days')), strictness: q.get('strictness') || undefined, tradition: q.get('tradition') || undefined, teacher: q.get('teacher') || undefined })],
  [/^\/api\/booking-draft$/, 'compose_booking', (m, q) => ({ place: q.get('place'), dates: q.get('dates'), programme: q.get('programme') || undefined })],
  [/^\/api\/recommend$/, 'recommend', (m, q, b) => ({ liked: b.liked || csv(q.get('liked')), disliked: b.disliked || csv(q.get('disliked')), topic: b.topic || q.get('topic') || undefined, exclude: b.exclude || csv(q.get('exclude')), maxMinutes: b.maxMinutes ?? num(q.get('maxMinutes')), k: b.k ?? num(q.get('k')) })],
]

export function restHandler(ctx, path, q, body, call) {
  if (path === '/api') return { status: 200, body: { openapi: '/openapi.json', endpoints: ROUTES.map((r) => `${r[1]}: ${r[0].source.replace(/\\\//g, '/').replace(/^\^|\$$/g, '')}`) } }
  for (const [re, tool, args] of ROUTES) {
    const m = path.match(re); if (!m) continue
    const dm = m.map((x) => { try { return decodeURIComponent(x) } catch { return x } })
    const a = JSON.parse(JSON.stringify(args(dm, q, body || {})))
    try { return { status: 200, body: call(tool, a) } } catch (e) {
      if (e.toolError) return { status: /unknown/.test(e.message) ? 404 : 400, body: { error: e.message } }
      return { status: e.code === -32602 ? 400 : 500, body: { error: e.message } }
    }
  }
  return { status: 404, body: { error: 'not_found', see: '/openapi.json' } }
}

const P = (name, description, schema = { type: 'string' }, where = 'query', required = false) => ({ name, in: where, required: where === 'path' || required, description, schema })
const OBJ = { $ref: '#/components/schemas/Result' }
const op = (operationId, summary, description, parameters, extra = {}) => ({ get: { operationId, summary, description, parameters, responses: { 200: { description: 'OK', content: { 'application/json': { schema: OBJ } } }, 404: { description: 'Unknown id', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }, 429: { description: 'Rate limited (Retry-After header)' } }, ...extra } })
const limitP = (d = 20, max = 100) => P('limit', `Max results (default ${d}).`, { type: 'integer', minimum: 1, maximum: max, default: d })

export function openapi(origin = MCP_BASE) {
  return {
    openapi: '3.1.0',
    info: { title: 'Satsang open directory API', version: '0.2.0',
      description: 'Read-only, no-auth API over Satsang (' + HOST + '): wisdom traditions and schools, teachers and lineages, places to practise with contacts as published, free texts, practices and talks. Every record has url (canonical page to cite), source_url, verified_on and confidence. Licence: CC BY 4.0 for Satsang curation; third-party data is metadata under its own terms. Same data as the MCP server at /mcp.',
      contact: { url: BASE + '/agents' }, license: { name: 'CC BY 4.0 (data), MIT (code)', url: 'https://creativecommons.org/licenses/by/4.0/' } },
    servers: [{ url: /(tantrafiles\.xyz|satsang\.digital)$/.test(origin) ? MCP_BASE : origin }],
    paths: {
      '/api/search': op('search', 'Search everything', 'Search teachers, traditions, topics, practices, texts, collections, places and talks. Returns {results:[{id,title,url}]}; pass id to /api/fetch.', [P('q', 'Search words, e.g. "Ajahn Chah" or "Zen monastery Japan".', { type: 'string' }, 'query', true), P('kinds', 'Comma list: person,tradition,topic,practice,resource,collection,place,clip'), limitP(10, 50)]),
      '/api/fetch': op('fetchRecord', 'Fetch one record', 'Full record by id from search (e.g. person/ajahn-chah, place/amaravati): {id,title,text,url,metadata} with source_url, verified_on, confidence.', [P('id', 'Record id such as person/ajahn-chah or a ' + HOST + ' URL.', { type: 'string' }, 'query', true)]),
      '/api/places': op('findPlaces', 'Find places to practise', 'Monasteries, retreat centres, ashrams, temples, sacred sites. Filters: tradition (incl. schools), school, country, region, type, status, living_teacher, offers.', [P('tradition', 'e.g. theravada, Tibetan Buddhism, sufism'), P('school', 'Exact school, e.g. thai-forest'), P('country', 'ISO code(s) or names, comma-separated'), P('region', 'europe, north-america, south-asia, southeast-asia, east-asia, oceania, south-america, middle-east, africa, asia, americas'), P('type', 'monastery, retreat, centre, ashram, temple, pilgrimage, retreat-centre, study-centre, sacred-site'), P('status', 'active, heritage or any', { type: 'string', enum: ['active', 'heritage', 'any'] }), P('living_teacher', 'Only places tied to a living teacher', { type: 'boolean' }), P('offers', 'Comma list that must all match, e.g. residential,10-day or sanskrit'), P('q', 'Free words'), limitP()]),
      '/api/places/search': op('searchPlaces', 'Search places (all filters)', 'Free text plus tradition, school, country, near (lat, lng, km; nearest first with distance_km), residential, online, language, has_upcoming_events, has_email.', [P('q', 'Free words, e.g. silent retreat'), P('tradition', 'Tradition (incl. schools)'), P('school', 'Exact school'), P('country', 'ISO code(s) or names'), P('lat', 'Latitude for near', { type: 'number' }), P('lng', 'Longitude for near', { type: 'number' }), P('km', 'Radius in km (default 100)', { type: 'number' }), P('residential', 'true = can stay', { type: 'boolean' }), P('online', 'true = online or hybrid', { type: 'boolean' }), P('language', 'e.g. en, de, Thai'), P('has_upcoming_events', 'Dated events in the next 90 days', { type: 'boolean' }), P('has_email', 'Publishes an email', { type: 'boolean' }), limitP()]),
      '/api/events': op('listEvents', 'Upcoming events', 'Dated events (next 90 days) read weekly from each place\u2019s own iCal feed or schema.org Event data, with source and fetched_at.', [P('place', 'Place id'), P('tradition', 'Tradition (incl. schools)'), P('country', 'ISO code(s) or names'), P('from', 'YYYY-MM-DD'), P('to', 'YYYY-MM-DD'), P('online', 'Online only', { type: 'boolean' }), P('q', 'Words in the event name'), limitP()]),
      '/api/places/{id}': op('getPlace', 'Place details', 'One place: contacts exactly as published with source and check date, programmes with as-of date, teachers, sister places, events, resources.', [P('id', 'Place id, e.g. amaravati', { type: 'string' }, 'path')]),
      '/api/teachers': op('findTeachers', 'Find teachers', 'Teachers, scholars and figures by tradition, school, living status, country/region (via their places), role and on_video.', [P('tradition', 'Tradition (incl. schools)'), P('school', 'Exact school'), P('living', 'true = living or likely living', { type: 'boolean' }), P('country', 'ISO code(s)'), P('region', 'Region'), P('role', 'teacher, scholar, figure', { type: 'string', enum: ['teacher', 'scholar', 'figure', 'translator', 'founder', 'author'] }), P('on_video', 'Has talks on Satsang', { type: 'boolean' }), P('q', 'Free words'), limitP()]),
      '/api/teachers/{id}': op('getTeacher', 'Teacher profile', 'Bio, years, works, best talks, lineage relations and places for one person.', [P('id', 'Person id, e.g. thanissaro-bhikkhu', { type: 'string' }, 'path'), P('talks', 'Number of talks', { type: 'integer', default: 10 })]),
      '/api/resources': op('getResources', 'Texts and books', 'Texts, books and libraries per tradition, person or topic, free (publisher\u2019s own free edition) vs paid-or-unknown.', [P('tradition', 'Tradition'), P('person', 'Person id or name'), P('topic', 'Topic id'), P('free', 'Only free', { type: 'boolean' }), P('kind', 'book, text, scripture, essay, library'), P('q', 'Free words'), limitP(25)]),
      '/api/lineage/path': op('getLineagePath', 'Lineage path', 'Shortest documented chain between two people (teacher-student, ordination, academic supervision, influence) with confidence and sources.', [P('from', 'Person id or name', { type: 'string' }, 'query', true), P('to', 'Person id or name', { type: 'string' }, 'query', true), P('lineage', 'all, dharma, academic, influence, institutional'), P('max_hops', 'Default 8', { type: 'integer' })]),
      '/api/lineage/{id}': op('getLineage', 'Lineage around a person', 'Teacher-student / academic edges up and down from a person or tradition.', [P('id', 'Person or tradition id', { type: 'string' }, 'path'), P('direction', 'up, down or both'), P('lineage', 'dharma, academic, influence, all'), P('hops', 'Default 3', { type: 'integer' })]),
      '/api/study/{tradition}': op('whatToStudy', 'Study path for a tradition', 'Orientation, then free online resources, practices and talks, then teachers (living first), then places to go.', [P('tradition', 'e.g. thai-forest, zen, kashmir-shaivism', { type: 'string' }, 'path'), P('limit', 'Items per step (default 6)', { type: 'integer', default: 6 })]),
      '/api/topics/{id}': op('getTopic', 'Topic across traditions', 'A topic (rebirth, death, self, karma...) with intro, questions, one-line takes per tradition, diverse talks, practices, texts.', [P('id', 'Topic id, e.g. rebirth', { type: 'string' }, 'path'), P('talks', 'Number of talks', { type: 'integer', default: 12 })]),
      '/api/practices': op('listPractices', 'Practices', 'Practices with plain steps, sources and cautions; filter by tradition, kind, topic.', [P('tradition', 'Tradition'), P('kind', 'meditation, visualisation, enquiry, chant, ritual, movement'), P('topic', 'Topic id'), limitP()]),
      '/api/collections': op('listCollections', 'Collections', 'Curated sets, journeys and syllabi.', []),
      '/api/collections/{id}': op('getCollection', 'One collection', 'A journey, syllabus or set with its ordered units and resolved items.', [P('id', 'Collection id', { type: 'string' }, 'path')]),
      '/api/retreats': op('findRetreats', 'Find retreats', 'Recurring programmes places publish (typical length, format, cost model, recurrence) with the official schedule link and last-confirmed date. No dated instances: dates come from the schedule page.', [P('country', 'ISO code(s) or names'), P('tradition', 'Tradition or school'), P('format', 'residential, non-residential, online, mixed'), P('length', 'e.g. 10-day, weekend, long, ongoing'), P('q', 'Free words'), limitP(20, 50)]),
      '/api/schedule/{id}': op('getSchedule', 'Place schedule', 'One place: programmes, yearly events (usual month), official schedule page (canonical for dates), last-checked dates.', [P('id', 'Place id, e.g. wat-ram-poeng', { type: 'string' }, 'path')]),
      '/api/retreat-plan': op('planRetreat', 'Plan a home retreat', 'One whole talk per day (never cut), a timetable scaled by strictness, rules overlay, warnings when it is a study week rather than a retreat, and places that run real retreats. Nothing is booked.', [P('topic', 'e.g. death, metta, awakening', { type: 'string' }, 'query', true), P('days', '1-365', { type: 'integer', minimum: 1, maximum: 365 }, 'query', true), P('strictness', 'gentle, standard or strict'), P('tradition', 'Tradition, optional'), P('teacher', 'Person id or name, optional')]),
      '/api/booking-draft': op('composeBooking', 'Draft a booking enquiry', 'Email text for the user to send themselves, from the contacts the place publishes. Never sends, books or takes payment; without a published email it returns the official page instead.', [P('place', 'Place id', { type: 'string' }, 'query', true), P('dates', 'e.g. 2027-01-04 to 2027-01-30', { type: 'string' }, 'query', true), P('programme', 'Programme id or name, optional')]),
      '/api/recommend': op('recommend', 'Recommend talks', 'Diverse talks from liked ids (clip ids, person/<id>, topic/<id>, tradition/<id>) plus next topics.', [P('liked', 'Comma list of liked ids'), P('disliked', 'Comma list'), P('topic', 'Restrict to a topic'), P('k', 'How many (default 8)', { type: 'integer' })]),
    },
    components: { schemas: {
      Result: { type: 'object', additionalProperties: true, description: 'Tool result. Records carry url (canonical ' + HOST + ' page), source_url, verified_on (YYYY-MM-DD) and confidence (high|medium|low).' },
      Error: { type: 'object', properties: { error: { type: 'string' } } } } },
  }
}
