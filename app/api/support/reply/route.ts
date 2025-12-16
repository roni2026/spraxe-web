import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { ticketId, customerEmail, subject, message, agentName } = await req.json();

    if (!customerEmail || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Configure Brevo (Sendinblue) Transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com', // Standard Brevo SMTP Host
      port: 587,
      auth: {
        user: process.env.BREVO_USER, // Add this to your .env.local
        pass: process.env.BREVO_PASS, // Add this to your .env.local
      },
    });

    // Email Template
    const mailOptions = {
      from: `"Spraxe Support" <${process.env.BREVO_USER}>`, // Your verified sender
      to: customerEmail,
      subject: `Re: ${subject} [Ticket #${ticketId.slice(0, 8)}]`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #1e3a8a;">Support Update</h2>
          <p>Dear Customer,</p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <br>
          <hr style="border: 0; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Ticket ID: ${ticketId}<br>
            Replied by: ${agentName}
          </p>
        </div>
      `,
    };

    // Send Email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Email Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
