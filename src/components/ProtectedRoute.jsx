"use client";

import { useRouter } from "next/navigation"; // Use next/navigation for App Router
import { useEffect, useState } from "react";
import { auth, firestore } from "@/context/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ roleRequired, children }) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Ensure this only runs on the client
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const { role } = userDocSnap.data();

          if (roleRequired.includes(role)) {
            setIsAuthorized(true); // Allow access
          } else {
            router.replace("/unauthorized"); // Redirect if role doesn't match
          }
        } else {
          router.replace("/login");
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        router.replace("/login");
      }
    });

    return () => unsubscribe();
  }, [roleRequired, router]);

  // Prevent rendering children until authorization check is complete
  if (!isAuthorized) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
