// app/middleware.js
import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "@/context/Firebase"; // Adjust path to Firebase config

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Get the currently logged-in user
  const user = auth.currentUser;

  if (!user) {
    // Redirect to login if the user is not authenticated
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Fetch the user's role from Firestore
  const roleDoc = await getDoc(doc(firestore, "users", user.uid));
  const userRole = roleDoc.exists() ? roleDoc.data().role : null;

  if (!userRole) {
    // If no role is found, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based access control
  if (userRole === "vendor") {
    if (!pathname.startsWith("/vendor")) {
      // Redirect vendors to their section if they try to access other areas
      return NextResponse.redirect(new URL("/vendor", request.url));
    }
  } else if (userRole === "user") {
    if (pathname.startsWith("/vendor") || pathname.startsWith("/admin")) {
      // Redirect users away from vendor and admin pages
      return NextResponse.redirect(new URL("/", request.url));
    }
  } else if (userRole === "admin") {
    if (!pathname.startsWith("/admin")) {
      // Redirect admins to their section if they try to access other areas
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  } else {
    // If the role is invalid or unknown, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Allow access if all checks pass
  return NextResponse.next();
}
