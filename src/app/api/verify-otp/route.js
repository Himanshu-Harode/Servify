import { firestore } from "@/context/Firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
          { error: "Email and OTP are required" },
          { status: 400 }
      );
    }

    // Fetch OTP from Firestore
    const otpRef = doc(firestore, "otps", email);
    const otpDoc = await getDoc(otpRef);

    if (!otpDoc.exists()) {
      return NextResponse.json(
          { error: "OTP not found or expired" },
          { status: 404 }
      );
    }

    const { otp: storedOtp, createdAt } = otpDoc.data();
    const otpCreatedAt = new Date(createdAt);
    const now = new Date();

    // Check if OTP has expired (valid for 5 minutes)
    if ((now - otpCreatedAt) / (1000 * 60) > 5) {
      await deleteDoc(otpRef); // Remove expired OTP
      return NextResponse.json(
          { error: "OTP has expired" },
          { status: 400 }
      );
    }

    if (storedOtp !== otp) {
      return NextResponse.json(
          { error: "Invalid OTP" },
          { status: 400 }
      );
    }

    // OTP verified successfully, delete OTP from Firestore
    await deleteDoc(otpRef);

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
    }, { status: 200 });

  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
        { error: error.message || "Failed to verify OTP" },
        { status: 500 }
    );
  }
}
