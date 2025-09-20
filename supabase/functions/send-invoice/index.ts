import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // Early exit if RESEND_API_KEY is not set
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set in Supabase secrets.");
    return new Response(
      JSON.stringify({ success: false, error: "Server configuration error: Missing API key." }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const {
      customerName,
      customerEmail,
      reservationId,
      reservationDate,
      totalAmount,
      paymentMethod,
    } = await req.json();

    if (!customerName || !customerEmail || !reservationId || !reservationDate || !totalAmount || !paymentMethod) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: sans-serif; color: #333; }
          .container { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #ddd; }
          .content { padding: 20px 0; }
          .footer { text-align: center; font-size: 0.9em; color: #888; margin-top: 20px; }
          .invoice-details { width: 100%; margin-top: 20px; }
          .invoice-details td { padding: 8px 0; }
          .invoice-details .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reservation Invoice</h1>
          </div>
          <div class="content">
            <p>Hello ${customerName},</p>
            <p>Thank you for your reservation! Here is the invoice for your booking.</p>
            <table class="invoice-details">
              <tr>
                <td class="label">Reservation ID:</td>
                <td>#${reservationId}</td>
              </tr>
              <tr>
                <td class="label">Reservation Date:</td>
                <td>${reservationDate}</td>
              </tr>
              <tr>
                <td class="label">Total Amount:</td>
                <td>${totalAmount}</td>
              </tr>
              <tr>
                <td class="label">Payment Method:</td>
                <td>${paymentMethod}</td>
              </tr>
            </table>
            <p>We look forward to seeing you!</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing our service.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Using a generic 'from' address for testing.
    // For production, you must verify your own domain with Resend.
    const resendPayload = {
      from: "Watee Baroesa <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Invoice for Reservation #${reservationId}`,
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
      console.error("Resend API Error:", errorBody);
      throw new Error(`Resend API Error: ${JSON.stringify(errorBody)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("General Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 500,
    });
  }
});