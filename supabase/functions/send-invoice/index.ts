import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { to, name, reservationId, date, time, guests, deposit } = await req.json();

    // Basic validation
    if (!to || !name || !reservationId || !date || !time || !guests || !deposit) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const reservationUrl = `https://wateebaroesa.com/reservation/${reservationId}`; // IMPORTANT: Replace with your actual domain

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
          .header { background-color: #C00000; color: #FFF; padding: 10px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; }
          .footer { text-align: center; font-size: 0.8em; color: #777; margin-top: 20px; }
          .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .details-table th, .details-table td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; }
          .details-table th { font-weight: bold; color: #C00000; }
          .button { display: inline-block; padding: 12px 24px; background-color: #D4AF37; color: #C00000; text-decoration: none; border-radius: 5px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Watee Baroesa Reservation</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for your reservation request. Please find your booking details below. A deposit is required to confirm your table.</p>
            
            <table class="details-table">
              <tr>
                <th>Reservation ID</th>
                <td>${reservationId.substring(0, 8)}</td>
              </tr>
              <tr>
                <th>Date & Time</th>
                <td>${date} at ${time}</td>
              </tr>
              <tr>
                <th>Guests</th>
                <td>${guests}</td>
              </tr>
              <tr>
                <th>Deposit Required</th>
                <td><strong>${deposit}</strong></td>
              </tr>
            </table>

            <p style="text-align:center; margin-top: 30px;">
              Please click the button below to view your reservation status and complete the payment.
            </p>
            <p style="text-align:center;">
              <a href="${reservationUrl}" class="button">View Reservation & Pay Deposit</a>
            </p>
            <p>We look forward to welcoming you!</p>
            <p>Sincerely,<br>The Watee Baroesa Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Watee Baroesa. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const resendPayload = {
      from: "Watee Baroesa <noreply@yourdomain.com>", // IMPORTANT: Replace with your verified Resend domain
      to: [to],
      subject: `Your Reservation at Watee Baroesa (ID: ${reservationId.substring(0, 8)})`,
      html: emailHtml,
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(resendPayload),
    });

    if (!res.ok) {
      const errorBody = await res.json();
      throw new Error(`Resend API Error: ${JSON.stringify(errorBody)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 500,
    });
  }
});