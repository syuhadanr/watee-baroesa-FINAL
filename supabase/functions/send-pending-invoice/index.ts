import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// CORS headers to allow requests from your web app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to format currency
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'bookingId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Fetch the reservation details
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !reservation) {
      throw new Error(`Reservation not found: ${fetchError?.message}`);
    }

    // 2. Check for missing email
    if (!reservation.email) {
      return new Response(JSON.stringify({ ok: false, message: 'Customer email is missing.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Check if email was already sent (idempotency)
    if (reservation.email_pending_sent_at) {
      return new Response(JSON.stringify({ ok: true, message: 'Email already sent.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    // Use the SITE_URL secret for the link, with a fallback.
    const siteUrl = Deno.env.get('SITE_URL') || `https://pfammobcbeahzwfktjov.supabase.co`;
    const reservationUrl = `${siteUrl}/reservation/${bookingId}`;

    const emailHtml = `
      <html>
        <body>
          <h1>Invoice ${reservation.invoice_no} - Pending Payment</h1>
          <p>Dear ${reservation.name},</p>
          <p>Thank you for your reservation at Watee Baroesa. Your booking is pending payment. Please find the details below:</p>
          <ul>
            <li><strong>Invoice Number:</strong> ${reservation.invoice_no}</li>
            <li><strong>Date:</strong> ${new Date(reservation.date).toLocaleDateString()}</li>
            <li><strong>Time:</strong> ${reservation.time}</li>
            <li><strong>Guests:</strong> ${reservation.guests}</li>
            <li><strong>Total Bill (est.):</strong> ${formatCurrency(reservation.total_bill)}</li>
            <li><strong>Deposit Required:</strong> ${formatCurrency(reservation.deposit_amount)}</li>
          </ul>
          <p>To confirm your booking, please complete the payment by visiting the link below:</p>
          <a href="${reservationUrl}">Complete Your Payment</a>
          <p>We look forward to welcoming you!</p>
          <p>Sincerely,<br/>The Watee Baroesa Team</p>
        </body>
      </html>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Watee Baroesa <reservations@mogjastore.com>',
        to: [reservation.email],
        subject: `Invoice ${reservation.invoice_no} – Pending Payment`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.json();
      throw new Error(`Failed to send email: ${JSON.stringify(errorBody)}`);
    }

    // 5. Update the reservation to mark the email as sent
    const { error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ email_pending_sent_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (updateError) {
      // Log this error but don't fail the request, as the email was sent
      console.error(`Failed to update email_pending_sent_at for ${bookingId}:`, updateError.message);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-pending-invoice function:', error.message);
    return new Response(JSON.stringify({ ok: false, message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});