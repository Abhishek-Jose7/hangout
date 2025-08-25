"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React from 'react';

// Basic default marker fix for Leaflet in bundlers
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon as unknown as L.Icon<L.IconOptions>;

type LatLng = { lat: number; lng: number };

type MarkerItem = {
  id: string;
  position: LatLng;
  label: string;
};

type GroupMapProps = {
  center: LatLng;
  zoom?: number;
  memberMarkers?: MarkerItem[];
  locationMarkers?: MarkerItem[];
  className?: string;
  style?: React.CSSProperties;
};

export default function GroupMap({
  center,
  zoom = 6,
  memberMarkers = [],
  locationMarkers = [],
  className,
  style
}: GroupMapProps) {
  return (
    <div className={className} style={style}>
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} style={{ height: '400px', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {memberMarkers.map(m => (
          <Marker key={m.id} position={[m.position.lat, m.position.lng]}>
            <Popup>
              <div>
                <strong>Member</strong>
                <div>{m.label}</div>
              </div>
            </Popup>
          </Marker>
        ))}
        {locationMarkers.map(m => (
          <Marker key={m.id} position={[m.position.lat, m.position.lng]}>
            <Popup>
              <div>
                <strong>Location</strong>
                <div>{m.label}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
