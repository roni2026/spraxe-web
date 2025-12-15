// app/api/send-invoice/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase/client'; // Adjust path if needed
import { getInvoiceData, generateInvoiceHTML } from '@/lib/invoice/invoice-generator';

export async function POST(req: Request) {
  try {
    const { orderId, email } = await req.json();

    if (!orderId || !email) {
      return NextResponse.json({ error: 'Missing orderId or email' }, { status: 400 });
    }

    console.log(`Sending invoice for ${orderId} to ${email}...`);

    // 1. Fetch Invoice Data
    const invoiceData = await getInvoiceData(orderId);
    if (!invoiceData) {
      return NextResponse.json({ error: 'Invoice data not found' }, { status: 404 });
    }

    // 2. Generate HTML
    const invoiceHtml = generateInvoiceHTML(invoiceData);

    // 3. Configure Brevo SMTP Transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: '9d0a00001@smtp-brevo.com', // Your Brevo Login
        pass: process.env.BREVO_SMTP_KEY, // STORE THIS IN .env.local FILE!
      },
    });

    // 4. Send Email
    const info = await transporter.sendMail({
      from: '"Spraxe Support" <support@spraxe.com>', // Sender address
      to: email, // Receiver address
      subject: `Invoice for Order #${invoiceData.invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Thank you for your order!</h2>
          <p>Hi ${invoiceData.customer.name},</p>
          <p>Your order <strong>#${invoiceData.invoiceNumber}</strong> is now <strong>Processing</strong>.</p>
          <p>Please find your invoice attached.</p>
          <br/>
          <p>Best regards,<br/>Spraxe Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice-${invoiceData.invoiceNumber}.html`,
          content: invoiceHtml,
          contentType: 'text/html', // Sends as a viewable HTML file (works like a PDF in browser)
        },
      ],
    });

    console.log('Message sent: %s', info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId });

  } catch (error: any) {
    console.error('Email Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

}

