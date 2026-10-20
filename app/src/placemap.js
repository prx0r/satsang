// Satsang Place map: Leaflet + OpenStreetMap tiles (no API key), loaded on demand from #places / #place / #country.
// Built to site/placemap.js (separate bundle so the screening never pays for it). Attribution always shown.
import L from './map/leaflet-global.js'
import 'leaflet.markercluster'

const TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'

// opts: { places: [{id,lat,lng,name,fam,goenka}], goenka: bool, onPick(id), fit: 'all'|'none', interactive }
export function mountMap(el, opts = {}) {
  const map = L.map(el, { zoomControl: true, worldCopyJump: true, scrollWheelZoom: opts.scroll !== false, attributionControl: true, minZoom: 2, maxZoom: 17, zoomSnap: 0.5 })
  map.attributionControl.setPrefix(false)
  L.tileLayer(TILE, { attribution: ATTR, maxZoom: 19, crossOrigin: true }).addTo(map)
  map.setView([22, 40], 2)
  const curated = L.layerGroup().addTo(map)
  const gk = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 46, spiderfyOnMaxZoom: true,
    iconCreateFunction: (c) => L.divIcon({ html: `<span>${c.getChildCount()}</span>`, className: 'pmclu', iconSize: [34, 34] }) })
  const byId = new Map()
  let picked = null
  const icon = (p, on) => L.divIcon({ className: `pmk f-${p.fam || 'x'}${p.goenka ? ' gk' : ''}${on ? ' on' : ''}`, html: '<i></i>', iconSize: p.goenka ? [14, 14] : [18, 18] })
  function setData(places, showGoenka) {
    curated.clearLayers(); gk.clearLayers(); byId.clear()
    for (const p of places) {
      if (p.lat == null || p.lng == null) continue
      const m = L.marker([p.lat, p.lng], { icon: icon(p, p.id === picked), title: p.name, keyboard: true, riseOnHover: true })
      m.on('click', () => opts.onPick && opts.onPick(p.id))
      byId.set(p.id, { m, p })
      ;(p.goenka ? gk : curated).addLayer(m)
    }
    if (showGoenka) { if (!map.hasLayer(gk)) map.addLayer(gk) } else if (map.hasLayer(gk)) map.removeLayer(gk)
  }
  function fit(ids, maxZoom = 7) {
    const pts = (ids ? ids.map((i) => byId.get(i)).filter(Boolean) : [...byId.values()]).map((x) => [x.p.lat, x.p.lng])
    if (!pts.length) return
    if (pts.length === 1) map.setView(pts[0], Math.min(maxZoom, 9))
    else map.fitBounds(L.latLngBounds(pts), { padding: [28, 28], maxZoom })
  }
  function pick(id, pan) {
    const old = picked && byId.get(picked); picked = id
    if (old) old.m.setIcon(icon(old.p, false))
    const x = id && byId.get(id); if (!x) return
    x.m.setIcon(icon(x.p, true)); x.m.setZIndexOffset(1000)
    if (pan) { if (x.p.goenka) gk.zoomToShowLayer(x.m, () => {}); else map.panTo([x.p.lat, x.p.lng], { animate: true }) }
  }
  setData(opts.places || [], !!opts.goenka)
  if (opts.fit !== 'none') fit(null, opts.maxZoom || 7)
  setTimeout(() => map.invalidateSize(), 60)
  return { map, setData, fit, pick, destroy: () => map.remove(), resize: () => map.invalidateSize() }
}
