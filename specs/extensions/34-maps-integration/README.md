# 34 — Maps integration (keyless now, API key later)

**What:** every place pinned, routed and explorable. Two layers so the map
works before any key exists and improves after one arrives.

**Layer 0 — keyless, ship now (no API key, no billing):**
- Direction links: `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>`
  on every place page (works on all devices, no key).
- Leaflet + OpenStreetMap tiles stay the base map (already in app, BRIEF).
- Coordinates from the graph (geo-audit below keeps them honest).

**Layer 1 — needs the owner's Google Maps API key (server-side only):**
- Embed API (map iframe on place/country pages), Places autocomplete
  (search box), Place photos (hero images with attribution — REQUIRED by
  Google's terms, display it), Geocoding API (verify/fill coords).
- Rules: key lives in Worker secrets, never in client JS; restrict by HTTP
  referrer (tantrafiles.xyz/*); enable billing with budget alerts + daily
  quota caps; cache geocode/photo results in D1 (respecting ToS cache
  limits); show Google logo/attribution wherever their tiles/data render.

**Answer to the API question:** yes — create the key at console.cloud.google.com
(Maps JavaScript API + Places API + Geocoding API), restrict it, hand it to
the lead agent for Worker secrets. Nothing here needs it to land first.

**Files:** MAPS-INTEGRATION.md, geo_audit.py (+ report), mcp note (places
already serve lat/lng via find_places/get_place — no new tools needed).
