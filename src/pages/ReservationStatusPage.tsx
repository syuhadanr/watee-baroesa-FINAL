import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { showSuccess, showError } from "@/utils/toast";
import { compressImage } from "@/utils/imageCompressor";
import { format, parseISO } from "date-fns";
import { QRCodeCanvas } from 'qrcode.react';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";

interface Reservation {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  date: string;
  time: string;
  guests: number;
  message?: string | null;
  status: 'Pending' | 'Confirmed' | 'Arrived' | 'Canceled' | 'No-show' | 'Rejected';
  table_number?: string | null;
  total_bill?: number | null;
  deposit_amount?: number | null;
  payment_status: 'Pending' | 'Deposit' | 'Paid' | 'Rejected';
  payment_proof_url?: string | null;
  qr_payload?: string | null;
  rejection_reason?: string | null;
}

const paymentFormSchema = z.object({
  paymentProof: z.any().refine(files => files?.length > 0, "Payment proof is required."),
});

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const StatusDisplay = ({ status, paymentStatus, rejectionReason }: { status: Reservation['status'], paymentStatus: Reservation['payment_status'], rejectionReason?: string | null }) => {
  if (status === 'Confirmed') {
    return <div className="flex items-center gap-2 text-acehnese-green"><CheckCircle /><span>Reservation Confirmed</span></div>;
  }
  if (status === 'Rejected') {
    return (
      <div className="text-destructive">
        <div className="flex items-center gap-2"><XCircle /><span>Reservation Rejected</span></div>
        {rejectionReason && <p className="text-sm ml-7 mt-1">Reason: {rejectionReason}</p>}
      </div>
    );
  }
  if (paymentStatus === 'Pending') {
    return <div className="flex items-center gap-2 text-royal-gold"><AlertCircle /><span>Pending Payment</span></div>;
  }
  if (paymentStatus === 'Deposit') {
    return <div className="flex items-center gap-2 text-pastel-blue"><Clock /><span>Pending Admin Confirmation</span></div>;
  }
  return <div className="flex items-center gap-2 text-muted-foreground"><Clock /><span>{status}</span></div>;
};

const ReservationStatusPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({ resolver: zodResolver(paymentFormSchema) });

  useEffect(() => {
    if (!bookingId) {
      navigate('/404');
      return;
    }
    const fetchReservation = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error || !data) {
        console.error("Error fetching reservation:", error);
        showError("Could not find reservation.");
        navigate('/');
      } else {
        setReservation(data);
      }
      setLoading(false);
    };
    fetchReservation();
  }, [bookingId, navigate]);

  const handlePaymentSubmit = async (values: z.infer<typeof paymentFormSchema>) => {
    if (!reservation) return;
    setIsSubmitting(true);
    
    let paymentProofUrl: string | null = null;
    let imageFile = values.paymentProof?.[0];

    try {
      imageFile = await compressImage(imageFile);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${reservation.name.replace(/\s/g, '_')}.${fileExt}`;
      const filePath = `payment_proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("assets").upload(filePath, imageFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(filePath);
      paymentProofUrl = publicUrl;
    } catch (error) {
      showError("Failed to upload payment proof.");
      console.error(error);
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase
      .from('reservations')
      .update({
        payment_proof_url: paymentProofUrl,
        payment_status: 'Deposit',
      })
      .eq('id', reservation.id)
      .select()
      .single();

    if (error) {
      showError("Failed to submit payment proof.");
    } else {
      showSuccess("Payment proof submitted! Your reservation is now pending confirmation.");
      setReservation(data);
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="container py-16 px-4 md:px-6">
        <Skeleton className="h-12 w-1/2 mx-auto mb-4" />
        <Skeleton className="h-6 w-3/4 mx-auto mb-12" />
        <Card className="max-w-3xl mx-auto">
          <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  const showPaymentSection = reservation.payment_status === 'Pending' && reservation.status !== 'Rejected';

  return (
    <div className="min-h-screen bg-pastel-cream py-16">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-royal-red mb-4">Reservation Status</h2>
          <p className="text-xl text-royal-gold italic">Your booking details for Watee Baroesa</p>
        </div>

        <Card className="max-w-3xl mx-auto bg-white border-royal-gold shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl text-royal-red">Booking ID: {reservation.id.substring(0, 8)}</CardTitle>
            <CardDescription className="text-lg font-semibold pt-2">
              <StatusDisplay status={reservation.status} paymentStatus={reservation.payment_status} rejectionReason={reservation.rejection_reason} />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-md space-y-2">
              <h3 className="text-xl font-semibold text-royal-red mb-3">Reservation Summary</h3>
              <div className="grid grid-cols-2 gap-y-1">
                <p className="font-medium">Name:</p><p>{reservation.name}</p>
                <p className="font-medium">Date:</p><p>{format(parseISO(reservation.date), "PPP")}</p>
                <p className="font-medium">Time:</p><p>{reservation.time}</p>
                <p className="font-medium">Guests:</p><p>{reservation.guests}</p>
                <p className="font-medium">Table:</p><p>{reservation.table_number || 'To be assigned'}</p>
                <p className="font-medium">Total Bill:</p><p className="font-bold">{formatCurrency(reservation.total_bill)}</p>
                <p className="font-medium">Deposit:</p><p className="font-bold">{formatCurrency(reservation.deposit_amount)}</p>
              </div>
            </div>

            {showPaymentSection && (
              <>
                <Separator className="bg-royal-gold" />
                <div className="space-y-4 text-center">
                  <h3 className="text-xl font-semibold text-royal-red">Payment Required</h3>
                  <p className="text-royal-red/80">Please make a deposit payment of <strong className="text-royal-red">{formatCurrency(reservation.deposit_amount)}</strong> using one of the methods below.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col items-center p-4 bg-pastel-cream border border-royal-gold rounded-md shadow-sm">
                      <p className="font-semibold text-royal-red mb-2">Scan to Pay (Example)</p>
                      <QRCodeCanvas value={reservation.qr_payload || `id=${reservation.id};dep=${reservation.deposit_amount}`} size={160} level="H" className="mb-3" />
                    </div>
                    <div className="flex flex-col items-start p-4 bg-pastel-cream border border-royal-gold rounded-md shadow-sm text-left">
                      <p className="font-semibold text-royal-red mb-2">Bank Transfer</p>
                      <p><strong>Bank Name:</strong> Bank Watee Baroesa</p>
                      <p><strong>Account Name:</strong> PT. Watee Baroesa</p>
                      <p><strong>Account Number:</strong> 123-456-7890</p>
                    </div>
                  </div>
                  <p className="text-royal-red/80 mt-4">After making the payment, please upload the proof below.</p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handlePaymentSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="paymentProof"
                      render={({ field: { onChange, value, ...rest } }) => (
                        <FormItem>
                          <FormLabel>Upload Payment Proof (Image/PDF)</FormLabel>
                          <FormControl>
                            <Input type="file" accept="image/*,application/pdf" {...rest} onChange={(e) => onChange(e.target.files)} className="border-royal-red focus:border-royal-gold" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red text-lg py-6">
                      {isSubmitting ? "Submitting..." : "Submit Payment Proof"}
                    </Button>
                  </form>
                </Form>
              </>
            )}

            {reservation.payment_status !== 'Pending' && reservation.status !== 'Rejected' && (
              <div className="text-center p-4 bg-acehnese-green/10 rounded-md">
                <p className="text-acehnese-green font-semibold">We have received your details. We will notify you via email once your reservation is confirmed by our team.</p>
              </div>
            )}

            <div className="text-center mt-6">
              <Button asChild variant="outline" className="border-royal-red text-royal-red hover:bg-royal-red hover:text-pastel-cream">
                <RouterLink to="/">Return to Home</RouterLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReservationStatusPage;