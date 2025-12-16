// app/api/support/reply/route.ts

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { ticketId, customerEmail, subject, message, agentName } = await req.json();

    // 1. Validation
    if (!customerEmail || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Check API Key
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error("Missing BREVO_API_KEY");
      return NextResponse.json({ error: "Server config error: Missing API Key" }, { status: 500 });
    }

    console.log(`Sending Support Reply for Ticket ${ticketId} to ${customerEmail}...`);

    // 3. Prepare Brevo Payload (HTTP API)
    const payload = {
      sender: {
        name: "Spraxe Support", 
        email: "spraxecare@gmail.com" // Must be a verified sender in Brevo
      },
      to: [
        {
          email: customerEmail,
          // name: customerName // Optional: You can pass this if available
        }
      ],
      subject: `Re: ${subject} [Ticket #${ticketId ? ticketId.slice(0, 8) : 'REF'}]`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">Support Update</h2>
          <p>Dear Customer,</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #1e3a8a; margin: 20px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          
          <p>If you have further questions, please reply directly to this email.</p>
          
          <br>
          <hr style="border: 0; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666; margin-top: 10px;">
            Ticket ID: <strong>${ticketId}</strong><br>
            Replied by: ${agentName || 'Spraxe Support Team'}
          </p>
        </div>
      `
    };

    // 4. Send Request to Brevo API (Port 443)
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // 5. Handle Response
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo API Error:", errorData);
      throw new Error(`Brevo API Failed: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Support reply sent via API:', data.messageId);

    return NextResponse.json({ success: true, messageId: data.messageId });

  } catch (error: any) {
    console.error('Email Failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
