import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Tooltip, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTx } from '../../lib/adminLang.js'
import { routes as ALL_ROUTES, stops as ALL_STOPS, terminals as ALL_TERMINALS, CITY } from '../../data/geo.js'
const STATUS_COLOR = {
  on_headway: '#38663b',
  deviating: '#d97706',
  bunching: '#7c3aed',
  not_responding: '#9aa3ae',
  off_service: '#c2c8d0',
  blocked: '#dc2626',
  maintenance: '#64748b',
}
export const STATUS_LABEL = {
  on_headway: 'On headway',
  deviating: 'Deviating',
  bunching: 'Bunching',
  not_responding: 'Not responding',
  off_service: 'Off service',
  blocked: 'Blocked',
  maintenance: 'Maintenance',
}
/** Control-room wording is not passenger wording. */
const SIMPLE_LEGEND = [
  ['on_headway', 'On time'],
  ['deviating', 'Running late'],
  ['not_responding', 'No signal'],
]
const ROUTE_COLOR = { Trunk: '#38663b', Feeder: '#8fb890', Intercity: '#0369a1' }
const pointOf = (id) => ALL_STOPS.find((s) => s.id === id) || ALL_TERMINALS.find((t) => t.id === id)
function busIcon(color, bearing, selected) {
  return L.divIcon({
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div style="width:26px;height:26px;display:grid;place-items:center">
      ${selected ? `<span style="position:absolute;width:26px;height:26px;border-radius:50%;background:${color};opacity:.18"></span>` : ''}
      <svg width="20" height="20" viewBox="-10 -10 20 20" style="transform:rotate(${bearing || 0}deg)">
        <path d="M0,-8 L6,6 L0,3 L-6,6 Z" fill="${color}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
      </svg>
    </div>`,
  })
}
function incidentIcon(priority) {
  const c = priority === 'P1' ? '#dc2626' : priority === 'P2' ? '#ea580c' : '#0284c7'
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;display:grid;place-items:center">
      <span style="position:absolute;width:28px;height:28px;border-radius:50%;background:${c};opacity:.16"></span>
      <span style="width:14px;height:14px;border-radius:50%;background:${c};color:#fff;font:700 10px/14px system-ui;text-align:center">!</span>
    </div>`,
  })
}
function terminalIcon() {
  return L.divIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: '<div style="width:14px;height:14px;border-radius:4px;background:#2d5130;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.25)"></div>',
  })
}

/** Keeps the viewport on whatever the screen is about, without fighting the user. */
function Fit({ focus, shapes, fitPoints, lockToFocus }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (focus?.lat != null && lockToFocus) {
      map.setView([focus.lat, focus.lng], Math.max(map.getZoom(), 14), { animate: true })
      return
    }
    if (done.current) return
    // Prefer the vehicles on screen: a fleet panel should frame the fleet, not
    // every line the operator happens to hold across the country.
    const pts = fitPoints?.length > 1 ? fitPoints : shapes.flat()
    if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts).pad(0.15), { animate: false })
      done.current = true
    } else if (focus?.lat != null) {
      map.setView([focus.lat, focus.lng], 14, { animate: false })
      done.current = true
    }
  }, [map, focus?.lat, focus?.lng, shapes, fitPoints, lockToFocus])
  return null
}

/**
 * Live network map on OpenStreetMap tiles. Route shapes come from the stop
 * sequence, vehicles from derived AVL. Works with no API key, which keeps the
 * platform free of a commercial map dependency.
 */
export default function MapView({
  vehicles = [],
  highlightRoutes,
  incidents = [],
  height = 420,
  onVehicleClick,
  selectedVehicle,
  showStops = true,
  showLabels = true,
  className = '',
  focus,
  lockToFocus = false,
  interactive = true,
  legend = 'ops',
}) {
  const tx = useTx()
  const shown = useMemo(
    () => (highlightRoutes ? ALL_ROUTES.filter((r) => highlightRoutes.includes(r.id)) : ALL_ROUTES),
    [highlightRoutes],
  )
  const shapes = useMemo(
    () =>
      shown.map((r) =>
        r.stops
          .map(pointOf)
          .filter(Boolean)
          .map((s) => [s.lat, s.lng]),
      ),
    [shown],
  )
  const visibleStops = useMemo(() => {
    if (!showStops) return []
    if (!highlightRoutes) return ALL_STOPS
    const ids = new Set(shown.flatMap((r) => r.stops))
    return ALL_STOPS.filter((s) => ids.has(s.id))
  }, [showStops, highlightRoutes, shown])
  const visibleTerminals = useMemo(() => {
    if (!highlightRoutes) return ALL_TERMINALS
    const ids = new Set(shown.flatMap((r) => r.stops.concat(r.terminals || [])))
    return ALL_TERMINALS.filter((t) => ids.has(t.id))
  }, [highlightRoutes, shown])
  const fitPoints = useMemo(() => vehicles.filter((v) => v.lat != null).map((v) => [v.lat, v.lng]), [vehicles])
  return (
    <div
      className={`relative isolate rounded-xl overflow-hidden border border-ink-200 ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={CITY.center}
        zoom={CITY.zoom}
        zoomControl={false}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        style={{ height: '100%', width: '100%', background: '#eef2ec' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {interactive && <ZoomControl position="bottomright" />}
        <Fit focus={focus} shapes={shapes} fitPoints={fitPoints} lockToFocus={lockToFocus} />

        {shown.map((r, i) => (
          <Polyline
            key={r.id}
            positions={shapes[i]}
            pathOptions={{
              color: ROUTE_COLOR[r.class] || '#4a7f4d',
              weight: r.class === 'Trunk' ? 4.5 : 3.5,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          >
            <Tooltip sticky>
              {r.line} · {r.name}
            </Tooltip>
          </Polyline>
        ))}

        {visibleStops.map((s) => (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={5}
            pathOptions={{ color: '#4a7f4d', weight: 2, fillColor: '#fff', fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -6]} permanent={showLabels && !!highlightRoutes}>
              {s.name}
            </Tooltip>
          </CircleMarker>
        ))}

        {visibleTerminals.map((t) => (
          <Marker key={t.id} position={[t.lat, t.lng]} icon={terminalIcon()}>
            <Tooltip direction="top" offset={[0, -8]}>
              {t.name}
            </Tooltip>
          </Marker>
        ))}

        {incidents.map((inc) =>
          inc.lat == null ? null : (
            <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={incidentIcon(inc.priority)}>
              <Tooltip direction="top" offset={[0, -10]}>
                {inc.priority} · {inc.category} · {inc.location}
              </Tooltip>
            </Marker>
          ),
        )}

        {vehicles.map((v) =>
          v.lat == null ? null : (
            <Marker
              key={v.id}
              position={[v.lat, v.lng]}
              icon={busIcon(STATUS_COLOR[v.status] || '#38663b', v.bearing, selectedVehicle === v.id)}
              eventHandlers={onVehicleClick ? { click: () => onVehicleClick(v) } : undefined}
            >
              <Tooltip direction="top" offset={[0, -12]}>
                <span style={{ fontWeight: 600 }}>{v.plate}</span>
                <br />
                {STATUS_LABEL[v.status]} · {v.speedKph} km/h
                {v.occupancyPct != null && <> · {v.occupancyPct}% full</>}
                {v.nextStop && (
                  <>
                    <br />
                    Next: {v.nextStop.name}
                  </>
                )}
              </Tooltip>
            </Marker>
          ),
        )}

        {focus?.lat != null && (
          <CircleMarker
            center={[focus.lat, focus.lng]}
            radius={7}
            pathOptions={{ color: '#fff', weight: 2.5, fillColor: '#2563eb', fillOpacity: 1 }}
          />
        )}
      </MapContainer>

      {vehicles.length > 0 && legend !== 'none' && (
        <div className="absolute bottom-2.5 left-2.5 z-[400] flex flex-wrap gap-x-3 gap-y-1 bg-white/92 backdrop-blur rounded-lg px-2.5 py-1.5 border border-ink-200 pointer-events-none">
          {(legend === 'simple' ? SIMPLE_LEGEND : Object.entries(STATUS_LABEL).slice(0, 4)).map(([k, label]) => (
            <span key={k} className="inline-flex items-center gap-1 text-[11px] text-ink-600">
              <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[k] }} />
              {tx(label)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
