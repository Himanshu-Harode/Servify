"use client";

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
});

export default function MapView({ userLocation, destinationName }) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const [vendorLocation, setVendorLocation] = useState(null);
    const [distance, setDistance] = useState(null);
    const [mapInitialized, setMapInitialized] = useState(false);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(2);
    };

    // Initialize map only when container is available
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current || !userLocation || !vendorLocation) return;

        const center = {
            lat: (userLocation.lat + vendorLocation.lat) / 2,
            lng: (userLocation.lng + vendorLocation.lng) / 2
        };

        const map = L.map(mapContainerRef.current, {
            center,
            zoom: 13,
            renderer: L.canvas()
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Add markers
        const customerMarker = L.marker([userLocation.lat, userLocation.lng]).addTo(map)
            .bindPopup(`<div><strong>Customer Location</strong><br>${destinationName || 'Customer'}</div>`);

        const vendorMarker = L.marker([vendorLocation.lat, vendorLocation.lng]).addTo(map)
            .bindPopup('<div><strong>Your Location</strong></div>');

        const polyline = L.polyline([
            [vendorLocation.lat, vendorLocation.lng],
            [userLocation.lat, userLocation.lng]
        ], { color: 'blue', weight: 3 }).addTo(map);

        mapRef.current = {
            map,
            markers: [customerMarker, vendorMarker, polyline]
        };

        setMapInitialized(true);

        return () => {
            if (mapRef.current) {
                mapRef.current.markers.forEach(marker => {
                    if (marker && mapRef.current?.map) {
                        mapRef.current.map.removeLayer(marker);
                    }
                });
                mapRef.current.map.remove();
                mapRef.current = null;
            }
            setMapInitialized(false);
        };
    }, [userLocation, vendorLocation, destinationName]);

    // Get vendor location
    useEffect(() => {
        let watchId;

        if (typeof window !== 'undefined' && navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const newLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setVendorLocation(newLocation);

                    if (userLocation?.lat && userLocation?.lng) {
                        setDistance(calculateDistance(
                            newLocation.lat,
                            newLocation.lng,
                            userLocation.lat,
                            userLocation.lng
                        ));
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    setVendorLocation({ lat: 0, lng: 0 });
                },
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [userLocation]);

    if (!userLocation || !vendorLocation) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                    <p className="text-lg font-medium">Loading locations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative">
            <div
                ref={mapContainerRef}
                className="h-full w-full"
                style={{ minHeight: '400px' }}
            />

            {distance && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-md z-10">
                    <p className="font-medium text-center">
                        Distance: <span className="text-blue-600">{distance} km</span>
                    </p>
                </div>
            )}
        </div>
    );
}
