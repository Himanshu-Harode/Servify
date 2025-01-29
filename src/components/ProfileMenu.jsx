"use client";

import { useEffect, useState } from "react";
import { auth, firestore } from "@/context/Firebase"; // Assuming firestore is initialized in your Firebase context
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOutIcon, UserPen } from "lucide-react";
import Link from "next/link";

const ProfileMenu = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Track loading state for Firestore data
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(firestore, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUser(userData);
          } else {
            console.log("User data not found in Firestore");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
        setLoading(false);
      } else {
        setUser(null);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return null;
  }

  // Determine the correct profile URL based on the user's role
  let profileUrl = "/profile"; // Default profile URL
  if (user.role === "vendor") {
    profileUrl = "/vendor/profile";
  } else if (user.role === "admin") {
    profileUrl = "/admin/profile";
  }

  return (
    <div className="border-[3px] border-primary rounded-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="w-12 h-12">
            <AvatarImage
              loading="lazy"
              src={
                user.profileImage
                  ? user.profileImage
                  : "https://github.com/shadcn.png"
              }
              alt={user.firstname ? user.firstname : "avatar"}
            />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem>
            <Link href={profileUrl}>
              <UserPen className="" /> Profile
            </Link>
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator className="h-1 text-black"></DropdownMenuSeparator>
          <DropdownMenuCheckboxItem>
            <Link href={"/login"}>
              <LogOutIcon className="mr-2" />
              Logout
            </Link>
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator className="h-1 text-black"></DropdownMenuSeparator>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProfileMenu;
