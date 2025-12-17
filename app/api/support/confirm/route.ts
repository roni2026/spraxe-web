// app/api/support/confirm/route.ts

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { ticketNumber, customerEmail, subject } = await req.json();

    // 1. Validation
    if (!ticketNumber || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 2. API Key Check
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error('Missing BREVO_API_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log(`Sending ticket confirmation: ${ticketNumber}`);

    // 3. Email Payload
    const payload = {
      sender: {
        name: 'Spraxe Support',
        email: 'spraxecare@gmail.com', // Must be verified in Brevo
      },
      to: [
        {
          email: customerEmail,
        },
      ],
      subject: `Ticket Received – ${ticketNumber}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2 style="color: #1e3a8a;">🎫 Ticket Received</h2>

          <p>Hello,</p>

          <p>
            Thank you for contacting <strong>Spraxe Support</strong>.
            Your support request has been successfully received.
          </p>

          <div style="background:#f8fafc;padding:15px;border-left:4px solid #1e3a8a;margin:20px 0;">
            <strong>Ticket Number:</strong><br>
            <span style="font-size:16px;">${ticketNumber}</span>
          </div>

          <p>
            Our support team will review your request and respond as soon as possible.
            Please keep this ticket number for future reference.
          </p>

          <p>
            If you need urgent help, you can also contact us via:
          </p>

          <ul>
            <li>💬 Messenger: <a href="https://m.me/spraxe">m.me/spraxe</a></li>
            <li>📱 WhatsApp: <a href="https://wa.me/01606087761">01606087761</a></li>
          </ul>

          <br>
          <hr style="border:none;border-top:1px solid #eee;">
          <p style="font-size:12px;color:#666;">
            This is an automated message. Please do not reply directly to this email.
          </p>
        </div>
      `,
    };

    // 4. Send via Brevo
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo Error:', errorData);
      throw new Error(errorData.message || 'Email failed');
    }

    const data = await response.json();
    console.log('Confirmation email sent:', data.messageId);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Confirmation Email Failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
