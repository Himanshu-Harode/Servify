import {auth, firestore} from "@/context/Firebase";
import {doc, serverTimestamp, updateDoc} from "firebase/firestore";

export const logoutUser = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        // 1. Update presence first
        const userRef = doc(firestore, "users", user.uid);
        await updateDoc(userRef, {
            isOnline: false,
            lastSeen: serverTimestamp(),
            status: "offline"
        });

        // 2. Small delay to ensure write completes
        await new Promise(resolve => setTimeout(resolve, 300));

        // 3. Sign out from Firebase
        await auth.signOut();

        // 4. Redirect (optional)
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Logout error:", error);
    }
};
