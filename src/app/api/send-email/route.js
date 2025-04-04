import { sendMail } from "@/lib/email-server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { to, subject, html } = await request.json();

        if (!to || !subject || !html) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        await sendMail({ to, subject, html });

        return NextResponse.json({
            success: true,
            message: "Email sent successfully",
        }, { status: 200 });

    } catch (error) {
        console.error("Email sending error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to send email" },
            { status: 500 }
        );
    }
}
