import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      throw new Error('bookingId is required');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !reservation) {
      throw new Error(`Reservation not found: ${fetchError?.message}`);
    }

    if (!reservation.email) {
      throw new Error('Customer email is missing.');
    }

    if (reservation.email_confirmed_sent_at) {
      return new Response(JSON.stringify({ ok: true, message: 'Confirmation email already sent.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const siteUrl = Deno.env.get('SITE_URL') || `https://pfammobcbeahzwfktjov.supabase.co`;
    const reservationUrl = `${siteUrl}/reservation/${bookingId}`;

    const emailHtml = `
      <html>
        <body>
          <h1>Your Reservation is Confirmed!</h1>
          <p>Dear ${reservation.name},</p>
          <p>We are delighted to confirm your reservation at Watee Baroesa. Here are your booking details:</p>
          <ul>
            <li><strong>Invoice Number:</strong> ${reservation.invoice_no}</li>
            <li><strong>Date:</strong> ${new Date(reservation.date).toLocaleDateString()}</li>
            <li><strong>Time:</strong> ${reservation.time}</li>
            <li><strong>Guests:</strong> ${reservation.guests}</li>
            <li><strong>Table:</strong> ${reservation.table_number || 'To be assigned'}</li>
          </ul>
          <p>Please present the QR code on the following page upon your arrival for a smooth check-in process.</p>
          <a href="${reservationUrl}">View Your Reservation & QR Code</a>
          <p>We look forward to welcoming you for an unforgettable dining experience!</p>
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
        subject: `Confirmed: Your Reservation at Watee Baroesa (${reservation.invoice_no})`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.json();
      throw new Error(`Failed to send email: ${JSON.stringify(errorBody)}`);
    }

    await supabaseAdmin
      .from('reservations')
      .update({ email_confirmed_sent_at: new Date().toISOString() })
      .eq('id', bookingId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-booking-confirmation function:', error.message);
    return new Response(JSON.stringify({ ok: false, message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});