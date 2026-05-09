import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: { lat: number; lng: number } | null;
}

export function MapModal({ isOpen, onClose, onLocationSelect, initialLocation }: MapModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<L.LatLng | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, [isOpen]);

  const handleMapClick = (e: any) => {
    const { lat, lng } = e.latlng;
    setSelectedLocation(L.latLng(lat, lng));
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation.lat, selectedLocation.lng);
      onClose();
    }
  };

  const handleUseCurrentLocation = () => {
    if (userLocation) {
      onLocationSelect(userLocation.lat, userLocation.lng);
      onClose();
    }
  };

  const defaultCenter = initialLocation || { lat: 40.7128, lng: -74.0060 }; // Default to NYC

  if (!isOpen) return null;

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal" onClick={(e) => e.stopPropagation()}>
        <div className="map-modal-header">
          <h3>Select Venue Location</h3>
          <button className="map-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="map-modal-body" onClick={handleMapClick}>
          <MapContainer
            center={[defaultCenter.lat, defaultCenter.lng]}
            zoom={13}
            style={{ height: '400px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>Your current location</Popup>
              </Marker>
            )}
            
            {selectedLocation && (
              <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                <Popup>
                  <div>
                    <p>Selected Location</p>
                    <p>Lat: {selectedLocation.lat.toFixed(6)}</p>
                    <p>Lng: {selectedLocation.lng.toFixed(6)}</p>
                    <button onClick={handleConfirmLocation} className="map-confirm-btn">
                      Use This Location
                    </button>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
        
        <div className="map-modal-footer">
          <button 
            className="map-current-location-btn" 
            onClick={handleUseCurrentLocation}
            disabled={!userLocation}
          >
            Use Current Location
          </button>
          <button 
            className="map-cancel-btn" 
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
