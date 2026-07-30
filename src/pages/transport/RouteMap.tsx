import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import type { StopValues } from '@/schemas/route.schema';

interface Props {
  stops: StopValues[];
  height?: number;
}

/**
 * Renders stops as circle markers + a connecting polyline. Deliberately avoids
 * leaflet's default L.Icon markers (their PNG asset paths break under Vite bundling) —
 * CircleMarker needs no external assets and matches the app's rounded, glassy aesthetic.
 */
export function RouteMap({ stops, height = 220 }: Props) {
  const valid = stops.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));
  if (valid.length === 0) {
    return (
      <div style={{ height }} className="rounded-xl3 glass-input flex items-center justify-center text-xs text-blush-700/50">
        Add stops with coordinates to see the map
      </div>
    );
  }
  const center: [number, number] = [valid[0].lat, valid[0].lng];
  const path: [number, number][] = valid.map((s) => [s.lat, s.lng]);

  return (
    <div style={{ height }} className="rounded-xl3 overflow-hidden">
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={path} pathOptions={{ color: '#e8779c', weight: 4, opacity: 0.8 }} />
        {valid.map((s, i) => (
          <CircleMarker
            key={i}
            center={[s.lat, s.lng]}
            radius={8}
            pathOptions={{ color: '#e8779c', fillColor: '#fff', fillOpacity: 1, weight: 3 }}
          >
            <Tooltip direction="top" offset={[0, -6]}>{s.name}{s.time ? ` · ${s.time}` : ''}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
