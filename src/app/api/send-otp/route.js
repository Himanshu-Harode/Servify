import { firestore } from "@/context/Firebase";
import { doc, setDoc } from "firebase/firestore";
import { sendOtpEmail } from "@/lib/email-server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
          { error: "Email is required" },
          { status: 400 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP

    // Store OTP in Firestore with timestamp
    const otpRef = doc(firestore, "otps", email);
    await setDoc(otpRef, {
      otp,
      createdAt: new Date().toISOString(),
    });

    // Send OTP via email
    await sendOtpEmail(email, otp);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    }, { status: 200 });

  } catch (error) {
    console.error("OTP sending error:", error);
    return NextResponse.json(
        { error: error.message || "Failed to send OTP" },
        { status: 500 }
    );
  }
}
