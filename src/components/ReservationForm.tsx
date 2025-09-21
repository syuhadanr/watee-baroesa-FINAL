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
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { publicTableOptions } from "@/lib/tableOptions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const DEFAULT_PRICE_PER_GUEST = 100000;

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
  date: z.string().min(1, { message: "Date is required." }),
  time: z.string().min(1, { message: "Time is required." }),
  guests: z.coerce.number().min(1, { message: "At least 1 guest is required." }),
  table_number: z.string().optional(),
  message: z.string().optional(),
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
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [reservationDetails, setReservationDetails] = useState<ReservationFormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
      message: "",
    },
  });

  const guests = form.watch("guests");
  const totalBill = (guests || 0) * DEFAULT_PRICE_PER_GUEST;
  const depositAmount = totalBill * 0.20;

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

  const onSubmit = (values: ReservationFormValues) => {
    setReservationDetails(values);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!reservationDetails) return;

    setIsSubmitting(true);

    const { data, error } = await supabase.from("reservations").insert([{
      name: reservationDetails.name,
      email: reservationDetails.email,
      phone: reservationDetails.phone,
      date: reservationDetails.date,
      time: reservationDetails.time,
      guests: reservationDetails.guests,
      table_number: reservationDetails.table_number === 'Auto Assign' ? null : reservationDetails.table_number,
      message: reservationDetails.message,
      total_bill: totalBill,
      deposit_amount: depositAmount,
      deposit_percentage: 20,
      status: 'Pending',
      payment_status: 'Pending',
    }]).select().single();

    setIsSubmitting(false);

    if (error) {
      console.error("Error submitting reservation:", error);
      showError("Failed to book reservation. Please try again.");
    } else {
      showSuccess("Reservation details confirmed. Please proceed to payment.");
      form.reset();
      setIsConfirmModalOpen(false);
      setReservationDetails(null);

      // Fire-and-forget email sending
      try {
        const { error: functionError } = await supabase.functions.invoke('send-pending-invoice', {
          body: { bookingId: data.id },
        });
        if (functionError) throw functionError;
      } catch (e) {
        console.error("Failed to trigger pending invoice email:", e);
        // Do not block user navigation
      }

      navigate(`/reservation/${data.id}`);
    }
  };

  return (
    <section id="reservations" className="py-16 bg-pastel-cream text-royal-red">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-royal-red mb-4">Book Your Table</h2>
          <p className="text-xl text-royal-gold italic">Experience Watee Baroesa</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Card className="bg-white border-royal-gold shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl text-royal-red">Make a Reservation</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <Button type="submit" disabled={form.formState.isSubmitting} className="w-full bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red text-lg py-6 transition-colors">
                    Book Now
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

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

      {reservationDetails && (
        <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
          <DialogContent className="bg-pastel-cream border-royal-gold">
            <DialogHeader>
              <DialogTitle className="text-2xl text-royal-red">Confirm Your Booking</DialogTitle>
              <DialogDescription className="text-royal-red/80">
                Please review your reservation details below before confirming.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <p className="font-semibold text-royal-red">Name:</p>
                <p>{reservationDetails.name}</p>
                <p className="font-semibold text-royal-red">Email:</p>
                <p>{reservationDetails.email}</p>
                {reservationDetails.phone && <>
                  <p className="font-semibold text-royal-red">Phone:</p>
                  <p>{reservationDetails.phone}</p>
                </>}
                <p className="font-semibold text-royal-red">Date & Time:</p>
                <p>{format(parseISO(reservationDetails.date), "PPP")} at {reservationDetails.time}</p>
                <p className="font-semibold text-royal-red">Guests:</p>
                <p>{reservationDetails.guests}</p>
                <p className="font-semibold text-royal-red">Table:</p>
                <p>{reservationDetails.table_number}</p>
              </div>
              <div className="border-t border-royal-gold pt-4 mt-4 space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Total Bill (est.):</span>
                  <span>{formatCurrency(totalBill)}</span>
                </div>
                <div className="flex justify-between font-semibold text-royal-red">
                  <span>20% Deposit Required:</span>
                  <span>{formatCurrency(depositAmount)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)} className="border-royal-red text-royal-red hover:bg-royal-red hover:text-pastel-cream">
                Cancel / Edit Details
              </Button>
              <Button onClick={handleConfirmBooking} disabled={isSubmitting} className="bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red">
                {isSubmitting ? "Confirming..." : "Confirm Reservation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
};

export default ReservationForm;