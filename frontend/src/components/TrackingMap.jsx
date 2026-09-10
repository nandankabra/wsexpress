import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TrackingMap = ({ events }) => {
  // Extract coordinates from events, assuming some might not have them
  const validCheckpoints = (events || [])
    .filter((event) => event.lat && event.lng)
    .map((event) => ({
      ...event,
      position: [event.lat, event.lng],
    }));

  if (validCheckpoints.length === 0) {
    // Return a default view if no specific coordinates are available
    return (
      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center border border-gray-200">
        <p className="text-gray-500">Map data unavailable for this shipment.</p>
      </div>
    );
  }

  const positions = validCheckpoints.map((cp) => cp.position);
  // Center map on the latest checkpoint
  const latestPosition = positions[0] || [0, 0];

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm mb-6" style={{ height: '400px', width: '100%' }}>
      <MapContainer center={latestPosition} zoom={4} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validCheckpoints.map((cp) => (
          <Marker key={cp.id} position={cp.position}>
            <Popup>
              <strong>{cp.status}</strong><br />
              {cp.location}<br />
              <span className="text-xs text-gray-500">{new Date(cp.timestamp).toLocaleString()}</span>
            </Popup>
          </Marker>
        ))}
        {positions.length > 1 && (
          <Polyline positions={positions} color="blue" weight={3} opacity={0.7} />
        )}
      </MapContainer>
    </div>
  );
};

export default TrackingMap;
