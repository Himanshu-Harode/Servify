// app/api/verify-otp/route.js
import { NextResponse } from "next/server";
import { firestore } from "@/context/Firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function POST(request) {
  const { email, otp } = await request.json();

  console.log("Received email:", email); // Debugging
  console.log("Received OTP:", otp); // Debugging

  if (!email || !otp) {
    return NextResponse.json(
      { message: "Email and OTP are required" },
      { status: 400 }
    );
  }

  try {
    // Fetch the OTP from Firestore
    const otpRef = doc(firestore, "otps", email); // Use email as the document ID
    const otpDoc = await getDoc(otpRef);

    if (!otpDoc.exists()) {
      console.log("OTP not found for email:", email); // Debugging
      return NextResponse.json({ message: "OTP not found" }, { status: 404 });
    }

    const storedOtp = otpDoc.data().otp; // Ensure the OTP is stored in the "otp" field
    const createdAt = otpDoc.data().createdAt; // Timestamp as a string

    console.log("Stored OTP:", storedOtp); // Debugging
    console.log("User OTP:", otp); // Debugging

    if (storedOtp === otp) {
      // Clear OTP after verification
      await setDoc(otpRef, { otp: null, createdAt: null });
      return NextResponse.json(
        { message: "OTP verified successfully" },
        { status: 200 }
      );
    } else {
      console.log("Invalid OTP provided"); // Debugging
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error); // Debugging
    return NextResponse.json(
      { message: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}