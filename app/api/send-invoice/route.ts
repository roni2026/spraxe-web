// app/api/send-invoice/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getInvoiceData, generateEmailInvoiceHTML } from '@/lib/invoice/invoice-generator';

export async function POST(req: Request) {
  try {
    const { orderId, email } = await req.json();

    if (!orderId || !email) {
      return NextResponse.json({ error: 'Missing orderId or email' }, { status: 400 });
    }

    console.log(`Sending inline invoice for ${orderId} to ${email}...`);

    // 1. Fetch Invoice Data
    const invoiceData = await getInvoiceData(orderId);
    if (!invoiceData) {
      return NextResponse.json({ error: 'Invoice data not found' }, { status: 404 });
    }

    // 2. Generate Email HTML
    const emailHtml = generateEmailInvoiceHTML(invoiceData);

    // 3. Configure Transporter (PLAN B: PORT 587)
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com', // Use the main domain again
      port: 587,                    // <--- CHANGE TO 587
      secure: false,                // <--- CHANGE TO FALSE (Required for 587)
      auth: {
        user: '9d0a00001@smtp-brevo.com',
        pass: process.env.BREVO_SMTP_KEY || process.env.SMTP_PASSWORD,
      },
      // NETWORK SETTINGS
      family: 4,              // Keep IPv4 (Vital)
      connectionTimeout: 60000, 
      greetingTimeout: 30000,   
      logger: true,           
      debug: true             
    } as any);

    // 4. Send Email
    const info = await transporter.sendMail({
      from: '"Spraxe Support" <9d0a00001@smtp-brevo.com>',
      to: email,
      subject: `Order #${invoiceData.invoiceNumber} Confirmation`,
      html: emailHtml,
    });

    console.log('Message sent: %s', info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId });

  } catch (error: any) {
    console.error('Email Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
