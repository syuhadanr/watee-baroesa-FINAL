import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format, parseISO } from "date-fns";
import { v4 as uuidv4 } from 'uuid';
import { compressImage } from "@/utils/imageCompressor";
import { Link as RouterLink } from "react-router-dom";
import { QRCodeCanvas } from 'qrcode.react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { publicTableOptions } from "@/lib/tableOptions";
import { Separator } from "@/components/ui/separator"; // Added Separator import

const DEFAULT_PRICE_PER_GUEST = 100000;

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
  date: z.string().min(1, { message: "Date is required." }),
  time: z.string().min(1, { message: "Time is required." }),
  guests: z.coerce.number().min(1, { message: "At least 1 guest is required." }),
  table_number: z.string().optional(),
  depositAmount: z.coerce.number().min(0, "Deposit cannot be negative."),
  message: z.string().optional(),
  paymentProof: z.any().optional(), // This will be conditionally validated
}).refine(data => {
  if (data.guests > 0) {
    const totalBill = data.guests * DEFAULT_PRICE_PER_GUEST;
    const minDeposit = totalBill * 0.20;
    return data.depositAmount >= minDeposit;
  }
  return true;
}, {
  message: "Deposit must be at least 20% of the total bill.",
  path: ["depositAmount"],
});

type ReservationFormValues = z.infer<typeof formSchema>;

interface Reservation {
  id: string;
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  guests: number;
  message?: string;
  created_at: string;
  table_number?: string | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const ReservationForm = () => {
  const [existingReservations, setExistingReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'details' | 'review' | 'success'>('details');
  const [reservationDetails, setReservationDetails] = useState<ReservationFormValues | null>(null);
  const [qrPayload, setQrPayload] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      date: "",
      time: "",
      guests: 1,
      table_number: "Auto Assign",
      depositAmount: 0,
      message: "",
      paymentProof: undefined,
    },
  });

  const guests = form.watch("guests");
  const totalBill = (guests || 0) * DEFAULT_PRICE_PER_GUEST;
  const minDeposit = totalBill * 0.20;

  useEffect(() => {
    form.setValue("depositAmount", minDeposit); // Set default deposit to min 20%
  }, [guests, minDeposit, form]);

  const fetchReservations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reservations")
      .select("id, name, time, table_number")
      .eq('status', 'Confirmed')
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      console.error("Error fetching reservations:", error);
      showError("Failed to load existing reservations.");
    } else {
      setExistingReservations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleDetailsSubmit = async (values: ReservationFormValues) => {
    setReservationDetails(values);
    const newReservationId = uuidv4(); // Generate a temporary ID for QR payload
    const depositAmountIDR = values.depositAmount;
    setQrPayload(`id=${newReservationId};dep=${depositAmountIDR}`);
    setStep('review');
  };

  const handleFinalSubmit = async (values: ReservationFormValues) => {
    if (!reservationDetails) return;

    setIsSubmitting(true);
    let paymentProofUrl: string | null = null;
    let imageFile = values.paymentProof?.[0]; // Use values from the form for paymentProof

    if (!imageFile) {
      showError("Payment proof is required.");
      setIsSubmitting(false);
      return;
    }

    try {
      imageFile = await compressImage(imageFile);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${reservationDetails.name.replace(/\s/g, '_')}.${fileExt}`;
      const filePath = `payment_proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("assets")
        .upload(filePath, imageFile);

      if (uploadError) {
        showError("Failed to upload payment proof.");
        console.error(uploadError);
        setIsSubmitting(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("assets")
        .getPublicUrl(filePath);
      
      paymentProofUrl = publicUrl;
    } catch (error) {
      setIsSubmitting(false);
      return;
    }

    const calculatedTotalBill = reservationDetails.guests * DEFAULT_PRICE_PER_GUEST;
    const depositPercentage = calculatedTotalBill > 0 ? (reservationDetails.depositAmount / calculatedTotalBill) * 100 : 0;

    const { error } = await supabase.from("reservations").insert([{
      name: reservationDetails.name,
      email: reservationDetails.email,
      phone: reservationDetails.phone,
      date: reservationDetails.date,
      time: reservationDetails.time,
      guests: reservationDetails.guests,
      table_number: reservationDetails.table_number === 'Auto Assign' ? null : reservationDetails.table_number,
      message: reservationDetails.message,
      total_bill: calculatedTotalBill,
      deposit_amount: reservationDetails.depositAmount,
      deposit_percentage: depositPercentage,
      status: 'Pending', // Initial status for reservation
      payment_status: 'Deposit', // Set payment_status to Deposit as a deposit is made
      qr_payload: qrPayload, // Store the QR payload string
      payment_proof_url: paymentProofUrl, // Store the uploaded proof URL
    }]);

    if (error) {
      console.error("Error submitting reservation:", error);
      showError("Failed to book reservation. Please try again.");
    } else {
      showSuccess("Reservation booked successfully! Awaiting admin confirmation.");
      form.reset();
      setReservationDetails(null);
      setQrPayload('');
      setStep('success');
      fetchReservations();
    }
    setIsSubmitting(false);
  };

  return (
    <section id="reservations" className="py-16 bg-pastel-cream text-royal-red">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-royal-red mb-4">Book Your Table</h2>
          <p className="text-xl text-royal-gold italic">Experience Watee Baroesa</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {step === 'details' && (
            <Card className="bg-white border-royal-gold shadow-lg">
              <CardHeader>
                <CardTitle className="text-3xl text-royal-red">Make a Reservation</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleDetailsSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Name" {...field} className="border-royal-red focus:border-royal-gold" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your@email.com" {...field} className="border-royal-red focus:border-royal-gold" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+1234567890" {...field} className="border-royal-red focus:border-royal-gold" />
                          </FormControl>
                            <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} className="border-royal-red focus:border-royal-gold" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} className="border-royal-red focus:border-royal-gold" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="guests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Guests</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} min={1} className="border-royal-red focus:border-royal-gold" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="table_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Table (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="border-royal-red focus:border-royal-gold">
                                  <SelectValue placeholder="Auto Assign" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {publicTableOptions.map(option => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Card className="bg-pastel-blue/30 border-pastel-blue p-4">
                      <div className="flex justify-between items-center mb-4">
                        <p className="font-semibold">Total Bill:</p>
                        <p className="font-bold text-lg">{formatCurrency(totalBill)}</p>
                      </div>
                      <FormField
                        control={form.control}
                        name="depositAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deposit Amount (min. 20%)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} min={0} placeholder={`Minimum: ${formatCurrency(minDeposit)}`} className="border-royal-red focus:border-royal-gold" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Card>
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Special Requests (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Allergies, special occasion, etc." {...field} className="border-royal-red focus:border-royal-gold" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting} className="w-full bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red text-lg py-6 transition-colors disabled:bg-gray-400">
                      {form.formState.isSubmitting ? "Processing..." : "Review & Pay"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {step === 'review' && reservationDetails && (
            <Card className="bg-white border-royal-gold shadow-lg">
              <CardHeader>
                <CardTitle className="text-3xl text-royal-red">Review Your Reservation & Pay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-md space-y-2">
                  <h3 className="text-xl font-semibold text-royal-red mb-3">Reservation Summary</h3>
                  <div className="grid grid-cols-2 gap-y-1">
                    <p className="font-medium text-royal-red">Name:</p><p className="text-royal-red/80">{reservationDetails.name}</p>
                    <p className="font-medium text-royal-red">Email:</p><p className="text-royal-red/80">{reservationDetails.email}</p>
                    {reservationDetails.phone && <><p className="font-medium text-royal-red">Phone:</p><p className="text-royal-red/80">{reservationDetails.phone}</p></>}
                    <p className="font-medium text-royal-red">Date:</p><p className="text-royal-red/80">{format(parseISO(reservationDetails.date), "PPP")}</p>
                    <p className="font-medium text-royal-red">Time:</p><p className="text-royal-red/80">{reservationDetails.time}</p>
                    <p className="font-medium text-royal-red">Guests:</p><p className="text-royal-red/80">{reservationDetails.guests}</p>
                    <p className="font-medium text-royal-red">Table:</p><p className="text-royal-red/80">{reservationDetails.table_number}</p>
                    <p className="font-medium text-royal-red">Total Bill:</p><p className="font-bold text-lg text-royal-red">{formatCurrency(totalBill)}</p>
                    <p className="font-medium text-royal-red">Required Deposit:</p><p className="font-bold text-lg text-royal-red">{formatCurrency(reservationDetails.depositAmount)}</p>
                    {reservationDetails.message && <><p className="font-medium text-royal-red">Special Requests:</p><p className="text-royal-red/80">{reservationDetails.message}</p></>}
                  </div>
                </div>

                <Separator className="bg-royal-gold" />

                <div className="space-y-4 text-center">
                  <h3 className="text-xl font-semibold text-royal-red">Payment Details</h3>
                  <p className="text-royal-red/80">Please make a deposit payment of <strong className="text-royal-red">{formatCurrency(reservationDetails.depositAmount)}</strong> using one of the methods below.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* QR Code Payment */}
                    <div className="flex flex-col items-center p-4 bg-pastel-cream border border-royal-gold rounded-md shadow-sm">
                      <p className="font-semibold text-royal-red mb-2">Scan to Pay (Example)</p>
                      <QRCodeCanvas value={qrPayload} size={160} level="H" className="mb-3" />
                      <p className="text-sm text-muted-foreground">
                        (This is a placeholder QR code for demonstration.)
                      </p>
                    </div>

                    {/* Bank Transfer Details */}
                    <div className="flex flex-col items-start p-4 bg-pastel-cream border border-royal-gold rounded-md shadow-sm text-left">
                      <p className="font-semibold text-royal-red mb-2">Bank Transfer</p>
                      <p className="text-royal-red/80"><strong>Bank Name:</strong> Bank Watee Baroesa</p>
                      <p className="text-royal-red/80"><strong>Account Name:</strong> PT. Watee Baroesa</p>
                      <p className="text-royal-red/80"><strong>Account Number:</strong> 123-456-7890</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Please transfer the deposit amount to this account.
                      </p>
                    </div>
                  </div>
                  <p className="text-royal-red/80 mt-4">After making the payment, please upload the proof below.</p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleFinalSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="paymentProof"
                      render={({ field: { onChange, value, ...rest } }) => (
                        <FormItem>
                          <FormLabel className="text-royal-red">Upload Payment Proof (Image/PDF)</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*,application/pdf"
                              {...rest}
                              onChange={(e) => onChange(e.target.files)}
                              className="border-royal-red focus:border-royal-gold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep('details')}
                        className="flex-grow border-royal-red text-royal-red hover:bg-royal-red hover:text-pastel-cream"
                      >
                        Back to Details
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !form.formState.isValid}
                        className="flex-grow bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red text-lg py-6 transition-colors disabled:bg-gray-400"
                      >
                        {isSubmitting ? "Submitting..." : "Confirm Reservation"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {step === 'success' && (
            <Card className="bg-white border-royal-gold shadow-lg col-span-full text-center p-8">
              <CardHeader>
                <CardTitle className="text-3xl text-acehnese-green">Reservation Confirmed!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-royal-red/80 text-lg">Thank you for your reservation at Watee Baroesa.</p>
                <p className="text-royal-red/80">Your payment proof has been received and your reservation is now awaiting admin confirmation.</p>
                <p className="text-royal-red/80">We look forward to welcoming you!</p>
                <Button onClick={() => setStep('details')} className="bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red text-lg py-6 transition-colors">
                  Make Another Reservation
                </Button>
                <Button asChild variant="outline" className="ml-4 border-royal-red text-royal-red hover:bg-royal-red hover:text-pastel-cream">
                  <RouterLink to="/">Return to Home</RouterLink>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Existing Reservations Card (always visible) */}
          <Card className="bg-white border-royal-gold shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl text-royal-red">Upcoming Reservations</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-royal-red">Loading reservations...</p>
              ) : existingReservations.length === 0 ? (
                <p className="text-center text-royal-red">No upcoming reservations.</p>
              ) : (
                <ul className="space-y-4">
                  {existingReservations.map((res) => (
                    <li key={res.id} className="p-4 border border-pastel-blue rounded-lg bg-pastel-cream/50 shadow-sm">
                      <p className="font-semibold text-royal-red">{res.name}</p>
                      <p className="text-sm text-royal-red/80">
                        Time: {res.time} | Table: {res.table_number || 'To be assigned'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ReservationForm;