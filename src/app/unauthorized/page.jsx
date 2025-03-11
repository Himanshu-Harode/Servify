"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, firestore } from "@/context/Firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import Loading from "../loading";

const UnauthorizedPage = () => {
  const router = useRouter();
  const [redirectPath, setRedirectPath] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;

      if (user) {
        try {
          const userDocRef = doc(firestore, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const { role } = userDocSnap.data();

            // Set redirect path based on role
            switch (role) {
              case "admin":
                setRedirectPath("/admin");
                break;
              case "vendor":
                setRedirectPath("/vendor");
                break;
              case "user":
                setRedirectPath("/");
                break;
              default:
                setRedirectPath("/login"); // Fallback
                break;
            }
          } else {
            setRedirectPath("/login");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRedirectPath("/login");
        }
      } else {
        setRedirectPath("/login");
      }
      setIsLoading(false);
    };

    fetchUserRole();
  }, [router]);

  useEffect(() => {
    if (redirectPath && !isLoading) {
      router.push(redirectPath);
    }
  }, [redirectPath, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading/>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen flex-col space-y-6">
      <h1 className="text-2xl font-bold">Unauthorized Access</h1>
      <p className="text-gray-600">You do not have permission to access this page.</p>
      <Button className="text-white" onClick={() => router.push(redirectPath)} disabled={!redirectPath}>
        Go to back to your page
      </Button>
    </div>
  );
};

export default UnauthorizedPage;