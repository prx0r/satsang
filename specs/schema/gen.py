#!/usr/bin/env python3
"""Generates specs/schema/*.json (JSON Schema 2020-12) for Wiser's unified data model.
Source of truth for the schemas; edit here, then `python3 gen.py`. See ../DATA-MODEL.md."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = "https://tantrafiles.xyz/schema/"
D = "2020-12"

def ref(name, frag=None):
    return {"$ref": f"{name}.json" + (f"#/$defs/{frag}" if frag else "")}
def c(frag):  # common def
    return ref("common", frag)
def arr(x, **k):
    return {"type": "array", "items": x, **k}
def S(**k):
    return {"type": "string", **k}
def enum(*v):
    return {"type": "string", "enum": list(v)}

def doc(name, title, desc, props, required, extra=None):
    d = {"$schema": f"https://json-schema.org/draft/{D}/schema", "$id": BASE + name + ".json",
         "title": title, "description": desc, "type": "object",
         "properties": {"type": {"const": name}, **props}, "required": ["id", "type", *required],
         "additionalProperties": True}
    if extra: d.update(extra)
    return d

common = {
    "$schema": f"https://json-schema.org/draft/{D}/schema", "$id": BASE + "common.json", "title": "Wiser common definitions",
    "$defs": {
        "slug": S(pattern=r"^[a-z0-9][a-z0-9-]{0,79}$", description="Lowercase ASCII slug. Never reused for a different thing; renames keep the old slug as an alias."),
        "topicPath": S(pattern=r"^[a-z0-9][a-z0-9-]*(/[a-z0-9][a-z0-9-]*){0,3}$", description="Slash path root/leaf/subleaf, e.g. rebirth/bardo."),
        "clipId": S(pattern=r"^[A-Za-z0-9_-]{11}(@[0-9]{1,6})?$", description="YouTube video id, or videoId@startSeconds for a virtual clip (a passage of a longer official video)."),
        "gid": S(pattern=r"^(person|tradition|clip|text|practice|topic|collection|place|event|edge|curation|essay|user)/.+$",
                 description="Global id = <kind>/<local id>. Also the canonical URL path: https://tantrafiles.xyz/<gid>."),
        "url": S(format="uri"),
        "date": S(pattern=r"^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$"),
        "wikidata": S(pattern=r"^Q[0-9]+$"),
        "fuzzyTime": {"type": "object", "description": "Years as integers, negative = BCE. basis says whose dating it is.",
            "properties": {"start": {"type": ["integer", "null"]}, "end": {"type": ["integer", "null"]},
                "precision": enum("day", "year", "decade", "century", "millennium"),
                "basis": enum("documented", "scholarly", "traditional", "estimate"),
                "label": S(description="Human label, e.g. 'c. 1925–1988' or '6th–5th c. BCE'."),
                "alt": S(description="Traditional or rival dating, shown alongside.")}},
        "source": {"type": "object", "required": ["url"], "properties": {
            "url": {"$ref": "#/$defs/url"}, "cite": S(), "checked": {"$ref": "#/$defs/date"},
            "check": enum("work", "cited", "mentioned", "unverified", "needs_source", "reviewed"),
            "licence": S(description="Licence of the SOURCE page, e.g. CC-BY-SA-4.0, CC-BY-NC-ND-4.0, publisher-free, all-rights-reserved.")}},
        "image": {"type": "object", "required": ["src"], "properties": {
            "src": {"$ref": "#/$defs/url"}, "face": {"$ref": "#/$defs/url"}, "page": {"$ref": "#/$defs/url"},
            "artist": S(), "license": S(), "licenseUrl": {"$ref": "#/$defs/url"}}},
        "ids": {"type": "object", "description": "External identifiers (sameAs).", "properties": {
            "wikidata": {"$ref": "#/$defs/wikidata"}, "viaf": S(), "orcid": S(pattern=r"^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]$"),
            "openpatala": S(), "atlas": S(), "enwiki": S(), "osm": S(), "doi": S(), "isbn": S(), "youtube_channel": S()},
            "additionalProperties": {"type": "string"}},
        "links": arr({"type": "object", "required": ["url"], "properties": {"label": S(), "url": {"$ref": "#/$defs/url"},
            "kind": enum("official", "books", "retreats", "contact", "wikipedia", "channel", "other")}}),
        "visibility": enum("public", "unlisted", "private"),
        "status": enum("draft", "review", "live", "retired"),
        "meta": {"type": "object", "description": "Record bookkeeping.", "properties": {
            "created": S(), "updated": S(), "status": {"$ref": "#/$defs/status"}, "aliases": arr(S()),
            "sources": arr({"$ref": "#/$defs/source"}), "confidence": enum("high", "medium", "low"),
            "license": S(description="Licence of THIS record's metadata. Wiser curation: CC-BY-4.0.")}},
        "ref": {"type": "object", "required": ["id"], "description": "A typed pointer to another record, with an optional note.",
            "properties": {"id": {"$ref": "#/$defs/gid"}, "note": S(), "start": {"type": "integer", "minimum": 0}, "end": {"type": "integer", "minimum": 0}}},
        "duration": {"type": "object", "description": "Minutes. Use min=max for a fixed length.",
            "properties": {"min": {"type": "number", "minimum": 0}, "max": {"type": "number", "minimum": 0}, "default": {"type": "number", "minimum": 0}}},
    },
}

person = doc("person", "Person (teacher, scholar or figure)",
    "One human (or a personified source such as Hermes Trismegistus). Roles are not exclusive: Thanissaro is teacher + translator. schema.org: Person.",
    {"id": c("slug"), "name": S(), "short": S(description="Short display name, e.g. 'Ajaan Geoff'."),
     "roles": arr(enum("teacher", "scholar", "figure", "translator", "founder", "author"), minItems=1, uniqueItems=True),
     "onVideo": {"type": "boolean", "description": "Has talks of their own on Wiser (was k:'speaker')."},
     "traditions": arr(c("slug"), description="Tradition node ids, most specific first. traditions[0] is the home node."),
     "years": c("fuzzyTime"), "living": {"type": "boolean", "description": "true only when no death date anywhere and nothing contradicts it."},
     "bio": S(maxLength=600, description="1–2 sentences, Wiser's own words."), "tagline": S(maxLength=140),
     "image": c("image"), "ids": c("ids"), "links": c("links"),
     "works": arr({"type": "object", "required": ["title"], "properties": {"id": S(), "title": S(), "year": {"type": ["integer", "null"]},
        "kind": S(description="Open vocabulary; common: book, talk series, retreat, text, critical_edition, translation, article, thesis, dialogues."),
        "publisher": S(), "doi": S(), "url": c("url"), "free": {"type": "boolean"}, "treats": arr(c("gid"))}}),
     "depth": {"type": "object", "description": "Computed, never hand-set.", "properties": {
        "clips": {"type": "integer"}, "fullTalks": {"type": "integer"}, "about": {"type": "integer"}, "topics": {"type": "integer"},
        "tier": enum("main", "more-voices", "figure"), "minutes": {"type": "number"}}},
     "meta": c("meta")}, ["name", "roles", "traditions"])

tradition = doc("tradition", "Tradition / school / lineage node",
    "A node of the tradition tree. family > school > lineage (> order/branch). Scholarly 'streams' (Atlas lanes) map onto nodes. schema.org: DefinedTerm in DefinedTermSet 'wiser-traditions' (+ Organization when it is a living order).",
    {"id": c("slug"), "label": S(), "kind": enum("family", "school", "lineage", "order", "stream"),
     "parent": {"oneOf": [c("slug"), {"type": "null"}]}, "children": arr(c("slug")),
     "blurb": S(maxLength=400), "years": c("fuzzyTime"), "founders": arr(c("slug")), "keyFigures": arr(c("slug")),
     "symbol": {"type": "object", "properties": {"glyph": S(description="Glyph id in the Wiser symbol set."), "ink": S(pattern=r"^#[0-9a-fA-F]{6}$")}},
     "ids": c("ids"), "meta": c("meta")}, ["label", "kind"])

clip = doc("clip", "Clip (a talk or a passage of one)",
    "A playable talk on an official upload. Natural clip = whole video; virtual clip = start/end passage of a longer official video (id videoId@start). Orientation is VERIFIED, never assumed. schema.org: VideoObject (virtual clips: Clip with isPartOf VideoObject).",
    {"id": c("clipId"), "title": S(), "sourceTitle": S(description="The upload's own title (was ytTitle)."), "talk": S(description="Parent talk title for virtual clips."),
     "media": {"type": "object", "required": ["provider", "videoId"], "properties": {
        "provider": enum("youtube", "vimeo", "archive", "dharmaseed-audio"), "videoId": S(),
        "parent": c("clipId"), "start": {"type": "integer", "minimum": 0}, "end": {"type": "integer", "minimum": 1},
        "channel": S(), "channelId": S(), "carrier": enum("own", "foundation", "estate", "publisher", "host"),
        "embeddable": {"type": "boolean"}, "embedChecked": c("date")}},
     "orientation": {"type": "object", "required": ["value", "verified"], "properties": {
        "value": enum("horizontal", "vertical", "square"), "verified": {"type": "boolean"},
        "method": enum("oembed", "shorts-redirect", "player-probe", "data-api"), "checked": c("date"),
        "w": {"type": "integer"}, "h": {"type": "integer"}}},
     "seconds": {"type": "integer", "minimum": 1, "description": "Played length (the passage for virtual clips)."},
     "videoSeconds": {"type": "integer", "description": "Whole upload length."},
     "lengthClass": enum("short", "talk", "full"), "delivery": enum("talk", "reading", "footage", "guided", "dialogue", "lecture", "chant"),
     "speaker": c("slug"), "figures": arr(c("slug")), "traditions": arr(c("slug"), minItems=1),
     "topics": arr({"type": "object", "required": ["id", "conf"], "properties": {"id": c("topicPath"), "conf": {"type": "number", "minimum": 0, "maximum": 1},
        "src": enum("title", "desc", "transcript", "human", "llm", "chapter"), "question": S(description="Hub sub-question id this clip answers.")}}),
     "practices": arr(c("slug"), description="Practices this clip instructs or guides."),
     "texts": arr(c("ref"), description="Texts expounded, optionally with passage refs."),
     "published": c("date"), "lang": S(), "views": {"type": "integer"},
     "inBallot": {"type": "boolean", "description": "Computed: eligible for resonance pairing."},
     "quality": {"type": "object", "description": "Editorial tier (app/tools/build-gold.py). gold = read by an editor and recommended, with a one-line why in Satsang's own words; strong = top ~12% by signals; absent = standard.",
        "properties": {"tier": enum("gold", "strong", "standard"), "why": S(maxLength=300), "goldTopics": arr(c("topicPath"))}},
     "hasTranscript": {"type": "boolean", "description": "Internal flag only. Transcript text, URL or path is NEVER published."},
     "stats": {"type": "object", "description": "Computed public aggregates.", "properties": {
        "bt": {"type": "number"}, "btSe": {"type": "number"}, "resonates": {"type": "integer"}, "completion": {"type": "number"}, "picks": {"type": "integer"}}},
     "meta": c("meta")}, ["title", "media", "orientation", "seconds", "speaker", "traditions"])

text = doc("text", "Text (scripture, treatise, book, essay)",
    "A work. Wiser links to legitimate free copies; it never rehosts. schema.org: Book / CreativeWork (scripture: CreativeWork + genre).",
    {"id": c("slug"), "title": S(), "altTitles": arr(S()), "authors": arr(c("slug")), "traditions": arr(c("slug")),
     "kind": enum("scripture", "sutta", "tantra", "treatise", "commentary", "book", "essay", "translation", "critical_edition", "article", "poem"),
     "years": c("fuzzyTime"), "lang": S(description="Original language, e.g. sa, pi, bo, zh, grc, ar, en."),
     "topics": arr(c("topicPath")), "commentaryOn": c("slug"), "translationOf": c("slug"),
     "editions": arr({"type": "object", "required": ["url"], "properties": {"title": S(), "translator": S(), "year": {"type": "integer"},
        "url": c("url"), "free": {"type": "boolean"}, "licence": S(), "publisher": S(), "doi": S(), "checked": c("date")}}),
     "ids": c("ids"), "meta": c("meta")}, ["title"])

STEP = {"type": "object", "required": ["text"], "properties": {
    "n": {"type": "integer", "minimum": 1}, "text": S(maxLength=600, description="Wiser's own words."),
    "seconds": {"type": "integer", "minimum": 0, "description": "Suggested time on this step (timer cue)."},
    "cue": enum("bell", "voice", "silent", "breath"),
    "visual": S(description="Visual spec id in the deitybody grammar (body locus, glyph, colour, motion)."),
    "clip": c("ref")}}
practice = doc("practice", "Practice",
    "Something you do, not watch. Steps are Wiser's own summary with a source link for the authoritative instruction. schema.org: HowTo (steps = HowToStep, duration = totalTime).",
    {"id": c("slug"), "name": S(), "kind": enum("meditation", "visualisation", "enquiry", "chant", "ritual", "movement"),
     "subkind": S(description="Free label: breath, mantra, body-scan, metta, koan, prayer, asana, prostration ..."),
     "traditions": arr(c("slug"), minItems=1), "summary": S(maxLength=400),
     "steps": arr(STEP, minItems=1), "duration": c("duration"),
     "level": enum("first-steps", "steady", "deep"), "posture": enum("seated", "lying", "standing", "walking", "any"),
     "eyes": enum("closed", "open", "either"), "needsTeacher": {"type": "boolean", "description": "Traditionally given only by a teacher / after initiation."},
     "contraindications": arr(S(), description="Plain cautions, e.g. 'trauma: keep eyes open, short sits', 'pregnancy: no breath retention'."),
     "sources": arr(c("source"), minItems=1), "teachers": arr(c("slug")), "clips": arr(c("ref")), "texts": arr(c("ref")),
     "topics": arr(c("topicPath")), "visual": S(description="deitybody framework/practice id."),
     "meta": c("meta")}, ["name", "kind", "traditions", "steps", "sources"])

QUESTION = {"type": "object", "required": ["id", "label"], "properties": {
    "id": c("slug"), "label": S(), "blurb": S(maxLength=300), "order": {"type": "integer"}}}
topic = doc("topic", "Topic",
    "A question people bring, seen across traditions. Hierarchical (root/leaf), with sub-questions. Keywords and transcript matching are INTERNAL build inputs and are not part of the public record. schema.org: DefinedTerm (+ CollectionPage for the hub).",
    {"id": c("topicPath"), "label": S(), "parent": {"oneOf": [c("topicPath"), {"type": "null"}]}, "children": arr(c("topicPath")),
     "intro": S(maxLength=900), "questions": arr(QUESTION), "related": arr(c("topicPath")),
     "terms": arr({"type": "object", "properties": {"term": S(), "lang": S(), "tradition": c("slug")}}, description="Source-language terms: punabbhava, saṃsāra, gilgul."),
     "takes": {"type": "object", "additionalProperties": S(maxLength=200), "description": "tradition id -> Wiser's one-line take (never a quote)."},
     "atlas": S(description="Atlas concept node id, e.g. c-rebirth."),
     "state": enum("seed", "proposed", "growing", "published", "merged", "retired"), "mergedInto": c("topicPath"),
     "depth": {"type": "object", "description": "Computed.", "properties": {"clips": {"type": "integer"}, "traditions": {"type": "integer"},
        "teachers": {"type": "integer"}, "practices": {"type": "integer"}, "texts": {"type": "integer"}, "places": {"type": "integer"}}},
     "meta": c("meta")}, ["label"])

ITEM = {"type": "object", "required": ["ref"], "properties": {
    "ref": c("ref"), "role": enum("watch", "read", "practise", "listen", "visit", "reflect"),
    "note": S(maxLength=1200), "optional": {"type": "boolean"}, "group": S(description="Grouping label, e.g. a tradition column."),
    "title": S(description="Display title for a read item."), "url": c("url")}}
UNIT = {"type": "object", "required": ["title", "items"], "properties": {
    "n": {"type": "integer", "minimum": 1}, "title": S(), "day": {"type": "integer", "minimum": 1, "description": "Journey day (1-based)."},
    "track": enum("theory", "practice", "both"), "intro": S(maxLength=1200), "items": arr(ITEM),
    "practice": {"type": "object", "description": "The daily practice for this unit.", "properties": {
        "id": c("slug"), "minutes": {"type": "number"}, "timesPerDay": {"type": "integer"}, "days": {"type": "integer"}}},
    "checkpoint": S(description="A short reflection prompt or self-check, openpatala-style.")}}
collection = doc("collection", "Collection",
    "An editorial or user-made grouping. kind decides how it plays: a set (unordered), a journey (ordered, multi-day, resumable), a meditation series, a visualisation cycle, a syllabus (theory + practice tracks). schema.org: set = ItemList / CreativeWork; journey/syllabus = Course with CourseInstance hasCourseInstance(courseSchedule); series = CreativeWorkSeries.",
    {"id": c("slug"), "kind": enum("set", "journey", "meditation-series", "visualisation-cycle", "syllabus", "mini-course"),
     "title": S(), "subtitle": S(), "intro": S(maxLength=4000), "cover": c("image"),
     "author": S(description="'wiser' for editorial, else user/<handle>."), "visibility": c("visibility"),
     "topics": arr(c("topicPath")), "traditions": arr(c("slug")),
     "ordered": {"type": "boolean"}, "units": arr(UNIT, minItems=1),
     "cadence": {"type": "object", "properties": {"days": {"type": "integer"}, "minutesPerDay": {"type": "number"}, "restDays": arr({"type": "integer"})}},
     "level": enum("first-steps", "steady", "deep"),
     "caution": S(maxLength=600, description="Shown before the first step (mini-courses): orientation-only notes, safety."), "orientationOnly": {"type": "boolean"},
     "minutes": {"type": "number", "description": "Rough total time (mini-courses)."},
     "deeper": arr({"type": "object", "required": ["ref"], "properties": {"ref": c("ref"), "note": S(maxLength=300)}}, description="Where to go deeper: places (retreats, monasteries) already in the directory."),
     "license": S(description="Default CC-BY-4.0 for editorial; author's choice for user collections."),
     "meta": c("meta")}, ["kind", "title", "units"],
    {"allOf": [{"if": {"properties": {"kind": {"enum": ["journey", "syllabus", "mini-course"]}}}, "then": {"properties": {"ordered": {"const": True}}}}]})

place = doc("place", "Place",
    "A monastery, centre, ashram, retreat house, pilgrimage site or lodge. Contacts only as published, each with its source. schema.org: Place / PlaceOfWorship / Organization (with geo GeoCoordinates).",
    {"id": c("slug"), "name": S(), "placeType": enum("monastery", "centre", "ashram", "retreat", "pilgrimage", "temple", "lodge", "grove", "hermitage", "other"),
     "traditions": arr(c("slug")), "country": S(pattern=r"^[A-Z]{2}$"), "city": S(),
     "geo": {"type": "object", "properties": {"lat": {"type": "number"}, "lng": {"type": "number"}, "precision": S(), "public": {"type": "boolean"}}},
     "founded": c("fuzzyTime"), "teachers": arr(c("slug"), description="Founders or historically tied; not 'teaches here now'."),
     "url": c("url"), "scheduleUrl": c("url"), "description": S(maxLength=600),
     "programmes": arr({"type": "object", "properties": {"id": S(), "name": S(), "typicalLength": S(), "format": S(), "costModel": enum("dana", "fixed", "sliding", "free", "unknown"), "scheduleUrl": c("url")}}),
     "contact": {"type": "object", "properties": {"checked": c("date"), "page": c("url"),
        "email": arr({"type": "array", "prefixItems": [S(), c("url")], "minItems": 2, "maxItems": 2}),
        "phone": arr({"type": "array", "prefixItems": [S(), c("url")], "minItems": 2, "maxItems": 2}),
        "address": {"type": "array", "prefixItems": [S(), c("url")]}}},
     "sisters": arr(c("slug")), "network": S(description="e.g. dhamma.org, ajahn-chah-branch, ramakrishna-math."),
     "mainTeacher": S(description="Person id of the one teacher responsible now (MINIMAL-ENTRY, satsang-extensions 12); medium-confidence links are queued for re-check."),
     "teacherModel": enum("single", "rotating", "none"), "mainTeacherConfidence": enum("high", "medium", "low"),
     "status": S(description="Activity status when not confirmed active (e.g. unknown)."),
     "ids": c("ids"), "meta": c("meta")}, ["name", "placeType", "traditions", "country"])

event = doc("event", "Event",
    "A dated happening: historical (a council, a founding) or upcoming (a retreat run, a live session). Upcoming events link out; dates are not cached long-term. schema.org: Event (EventSeries for recurring).",
    {"id": c("slug"), "name": S(), "eventKind": enum("historical", "retreat", "course", "talk", "sit", "festival", "session"),
     "when": c("fuzzyTime"), "startsAt": S(format="date-time"), "endsAt": S(format="date-time"), "tz": S(),
     "place": c("slug"), "online": {"type": "boolean"}, "joinUrl": c("url"), "url": c("url"),
     "teachers": arr(c("slug")), "traditions": arr(c("slug")), "topics": arr(c("topicPath")),
     "recurrence": S(description="RFC 5545 RRULE when recurring."), "meta": c("meta")}, ["name", "eventKind"])

EDGE_TYPES = ["teacher_of", "studied_with", "ordained_by", "dharma_heir_of", "academic_supervisor_of", "influenced", "translated",
              "commented_on", "edited", "founded", "lineage_of", "member_of", "abbot_of", "teacher_at", "expounds", "parallels", "sister_of"]
edge = doc("edge", "Lineage / relation edge",
    "A directed, sourced relation. Two lineage families are first-class: dharma (teacher_of, ordained_by, dharma_heir_of, studied_with) and academic (academic_supervisor_of, edited, translated). Direction always reads src -> dst: src teacher_of dst.",
    {"id": S(description="Deterministic: <src>~<type>~<dst> (slugs), so the same fact never gets two ids."),
     "src": c("gid"), "dst": c("gid"), "rel": enum(*EDGE_TYPES), "lineage": enum("dharma", "academic", "influence", "institutional", "textual", "geographic"),
     "when": c("fuzzyTime"), "conf": enum("high", "medium", "low"), "basis": enum("documented", "scholarly", "traditional"),
     "contested": S(description="Short note when disputed; shown with the edge."), "note": S(maxLength=300),
     "sources": arr(c("source")), "meta": c("meta")}, ["src", "dst", "rel", "lineage", "conf"])

curation = doc("curation", "User curation or essay",
    "User-authored. A curation is a Collection authored by a person (same item model), a hub-like page at /c/<handle>/<slug>. An essay is the user's own writing attached to a curation, topic, clip, text, practice or person. Public pages are CC BY 4.0 by default unless the author picks another licence; private ones never leave the account except in the author's own export. schema.org: Collection (curation) / Article or BlogPosting (essay), author Person.",
    {"id": S(pattern=r"^[a-z0-9_-]{2,32}/[a-z0-9-]{1,80}$", description="<handle>/<slug>"),
     "form": enum("curation", "essay"), "author": S(description="user/<handle>"), "title": S(maxLength=140), "visibility": c("visibility"),
     "body": S(maxLength=40000, description="Markdown (KaTeX allowed). Essays only; curations use intro."),
     "collection": ref("collection", None), "attachedTo": arr(c("gid")),
     "license": enum("CC-BY-4.0", "CC-BY-SA-4.0", "CC-BY-NC-4.0", "all-rights-reserved"),
     "moderation": {"type": "object", "properties": {"state": enum("ok", "queued", "hidden", "removed"), "reports": {"type": "integer"}}},
     "stats": {"type": "object", "properties": {"saves": {"type": "integer"}, "follows": {"type": "integer"}}},
     "meta": c("meta")}, ["form", "author", "title", "visibility"])

profile = doc("profile", "Practitioner profile (export shape)",
    "What a user owns and can export (GET /me/export). Private by default. See ../PROFILE.md.",
    {"id": S(description="user/<uuid> or d:<device id> before account merge"), "handle": S(), "displayName": S(),
     "visibility": {"type": "object", "properties": {"profile": c("visibility"), "taste": c("visibility"), "practice": c("visibility"), "curations": c("visibility")}},
     "taste": {"type": "object", "description": "Normalised weights in [-1,1] with counts. Derived; re-computable from events.", "properties": {
        "traditions": {"type": "object", "additionalProperties": {"type": "number"}}, "topics": {"type": "object", "additionalProperties": {"type": "number"}},
        "teachers": {"type": "object", "additionalProperties": {"type": "number"}}, "styles": {"type": "object", "additionalProperties": {"type": "number"}},
        "n": {"type": "integer"}, "updated": S()}},
     "votes": arr({"type": "object", "properties": {"a": c("clipId"), "b": c("clipId"), "winner": S(), "at": S(), "lowWatch": {"type": "boolean"}, "context": S()}}),
     "resonates": arr({"type": "object", "properties": {"clip": c("clipId"), "at": S(), "t": {"type": "integer"}}}),
     "saved": arr({"type": "object", "properties": {"id": c("gid"), "at": S(), "list": S()}}),
     "practiceLog": arr({"type": "object", "required": ["practice", "at", "minutes"], "properties": {"practice": c("slug"), "at": S(), "minutes": {"type": "number"},
        "routine": S(), "journey": S(), "note": S(maxLength=2000), "quality": {"type": "integer", "minimum": 1, "maximum": 5}}}),
     "routines": arr({"type": "object", "properties": {"id": S(), "name": S(), "blocks": arr({"type": "object", "properties": {"practice": c("slug"), "minutes": {"type": "number"}, "bell": S()}}),
        "schedule": S(description="RRULE"), "tz": S(), "remind": {"type": "boolean"}}}),
     "journeys": arr({"type": "object", "properties": {"collection": c("slug"), "started": S(), "unit": {"type": "integer"}, "done": arr({"type": "integer"}), "paused": {"type": "boolean"}}}),
     "worksLog": arr({"type": "object", "properties": {"id": S(), "state": enum("want", "reading", "read", "heard")}}),
     "places": arr({"type": "object", "properties": {"place": c("slug"), "state": enum("wishlist", "booked", "been")}})},
    [])

for name, d in [("common", common), ("person", person), ("tradition", tradition), ("clip", clip), ("text", text), ("practice", practice),
                ("topic", topic), ("collection", collection), ("place", place), ("event", event), ("edge", edge), ("curation", curation), ("profile", profile)]:
    with open(os.path.join(HERE, name + ".json"), "w") as f:
        json.dump(d, f, indent=1, ensure_ascii=False); f.write("\n")
print("wrote 13 schemas")
