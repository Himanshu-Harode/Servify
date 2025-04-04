// components/PresenceTracker.js
"use client";
import { useEffect } from "react";
import { auth, firestore } from "@/context/Firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const PresenceTracker = () => {
    const updatePresence = async (isOnline) => {
        if (!auth.currentUser) return;

        try {
            await updateDoc(doc(firestore, "users", auth.currentUser.uid), {
                isOnline,
                lastSeen: serverTimestamp(),
                status: isOnline ? "online" : "offline"
            });
        } catch (error) {
            console.error("Presence update error:", error);
        }
    };

    useEffect(() => {
        // Set online when component mounts
        updatePresence(true);

        // Handle tab/browser close
        const handleBeforeUnload = () => updatePresence(false);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            // Cleanup
            window.removeEventListener("beforeunload", handleBeforeUnload);
            updatePresence(false);
        };
    }, []);

    return null;
};

export default PresenceTracker;
