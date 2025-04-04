import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export async function sendMail({ to, subject, html }) {
    try {
        return await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
}

export async function sendOtpEmail(email, otp) {
    return sendMail({
        to: email,
        subject: 'OTP for Booking Completion',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Your Verification Code</h2>
        <p>Please use the following OTP to complete your booking:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</span>
        </div>
        <p>This code will expire in 5 minutes.</p>
      </div>
    `,
    });
}

export async function sendBookingAcceptedEmail(booking, vendor, recipientEmail) {
    return sendMail({
        to: recipientEmail,
        subject: `Booking Accepted - ${vendor.organizationName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Booking Accepted!</h2>
        <p>Your booking with ${vendor.organizationName} has been accepted.</p>
        
        <h3 style="color: #4b5563;">Booking Details</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Service:</strong> ${booking.service}</li>
          <li><strong>Date:</strong> ${booking.date}</li>
          <li><strong>Time:</strong> ${booking.time}</li>
        </ul>
        
        <h3 style="color: #4b5563;">Vendor Information</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Organization:</strong> ${vendor.organizationName}</li>
          <li><strong>Contact:</strong> ${vendor.name}</li>
          <li><strong>Phone:</strong> ${vendor.mobile}</li>
          <li><strong>Email:</strong> ${vendor.email}</li>
          <li><strong>Address:</strong> ${vendor.address}</li>
        </ul>
      </div>
    `,
    });
}
