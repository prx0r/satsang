// Leaflet as a global first: leaflet.markercluster's UMD build reads window.L when it is evaluated.
import L from 'leaflet/dist/leaflet-src.js'
window.L = L
export default L
