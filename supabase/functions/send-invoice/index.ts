import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Get the Resend API key from the environment variables
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Define CORS headers for cross-origin requests
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // This is needed for CORS preflight requests.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // Destructure the required fields from the request body
    const {
      customerName,
      customerEmail,
      reservationId,
      reservationDate,
      totalAmount,
      paymentMethod,
    } = await req.json();

    // Validate that all required fields are present
    if (!customerName || !customerEmail || !reservationId || !reservationDate || !totalAmount || !paymentMethod) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Construct the HTML body for the email
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

    // Create the payload for the Resend API
    const resendPayload = {
      from: "Watee Baroesa <noreply@myapp.com>", // You can customize the sender name and email
      to: [customerEmail],
      subject: `Invoice for Reservation #${reservationId}`,
      html: emailHtml,
    };

    // Send the email using the Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(resendPayload),
    });

    // Check if the email was sent successfully
    if (!res.ok) {
      const errorBody = await res.json();
      throw new Error(`Resend API Error: ${JSON.stringify(errorBody)}`);
    }

    // Return a success response
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // Return an error response if something went wrong
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 500,
    });
  }
});