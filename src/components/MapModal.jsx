"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./MapView'), {
    ssr: false,
    loading: () => (
        <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center">
                <p className="text-lg font-medium">Loading map...</p>
            </div>
        </div>
    )
});

export default function MapModal({ isOpen, onClose, userLocation, destinationName }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose} >
            <DialogContent className="max-w-4xl h-[80vh] sm:h-[70vh] rounded-xl">
                <DialogHeader>
                    <DialogTitle>Customer Location</DialogTitle>
                </DialogHeader>
                <div className="h-full w-full">
                    {userLocation?.lat && userLocation?.lng ? (
                        <MapView
                            key={`map-view-${userLocation.lat}-${userLocation.lng}-${Date.now()}`}
                            userLocation={userLocation}
                            destinationName={destinationName}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
                            <div className="text-center p-4">
                                <p className="text-lg font-medium">Location Unavailable</p>
                                <p className="text-sm text-gray-500">
                                    {destinationName || 'The customer'} has not shared their location
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
