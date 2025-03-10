// app/api/send-otp/route.js
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { firestore } from "@/context/Firebase"; // Import Firestore
import { doc, setDoc } from "firebase/firestore";

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service (e.g., Gmail, Outlook)
  auth: {
    user: process.env.EMAIL_USER, // Replace with your email
    pass: process.env.EMAIL_PASSWORD, // Replace with your email password
  },
});

export async function POST(request) {
  const { email } = await request.json();
  console.log("Received email:", email); // Debugging

  if (!email) {
    return NextResponse.json(
      { message: "Email is required" },
      { status: 400 }
    );
  }

  const otp = generateOTP();

  // Store OTP in Firestore
  try {
    const otpRef = doc(firestore, "otps", email); // Use email as the document ID
    await setDoc(otpRef, { otp, createdAt: new Date().toISOString() });

    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender email
      to: email, // Recipient email
      subject: "OTP for Booking Completion",
      text: `Your OTP for marking the booking as complete is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", email); // Debugging
    return NextResponse.json(
      { message: "OTP sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email or storing OTP:", error); // Debugging
    return NextResponse.json(
      { message: "Failed to send OTP" },
      { status: 500 }
    );
  }
}