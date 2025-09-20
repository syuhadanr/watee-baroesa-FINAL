import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Reservation {
  id: string;
  booking_id: string;
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  guests: number;
  status: string;
  created_at: string;
}

const ReservationPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservation = async () => {
      if (!bookingId) {
        setError("No booking ID provided");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("reservations")
          .select("*")
          .eq("booking_id", bookingId)
          .single();

        if (fetchError) {
          setError("Reservation not found");
          console.error("Error fetching reservation:", fetchError);
        } else {
          setReservation(data);
        }
      } catch (err) {
        setError("Failed to fetch reservation");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-pastel-cream flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-pastel-cream flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-royal-red">Reservation Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-royal-red/80 mb-4">{error || "The reservation could not be found."}</p>
            <Button asChild className="bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red">
              <Link to="/reservations">Make a New Reservation</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pastel-cream flex items-center justify-center py-8">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-royal-red">Thank You!</CardTitle>
          <p className="text-royal-gold">Your reservation has been received</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="font-semibold text-royal-red">Booking Reference:</p>
            <p className="text-royal-red/80 font-mono bg-pastel-blue/30 p-2 rounded">{reservation.booking_id}</p>
          </div>
          
          <div className="space-y-2">
            <p className="font-semibold text-royal-red">Status:</p>
            <p className="text-royal-red/80 capitalize">{reservation.status.replace('_', ' ')}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-royal-red">Details:</p>
            <p className="text-royal-red/80">{reservation.name}</p>
            <p className="text-royal-red/80">{reservation.email}</p>
            {reservation.phone && <p className="text-royal-red/80">{reservation.phone}</p>}
            <p className="text-royal-red/80">{new Date(reservation.date).toLocaleDateString()} at {reservation.time}</p>
            <p className="text-royal-red/80">{reservation.guests} guest(s)</p>
          </div>

          <div className="bg-pastel-blue/20 p-4 rounded-md">
            <p className="text-royal-red font-semibold">Next Steps:</p>
            <p className="text-royal-red/80 text-sm mt-1">
              We will send you payment instructions soon. Please check your email for further details.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button asChild className="bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red">
              <Link to="/">Return to Home</Link>
            </Button>
            <Button asChild variant="outline" className="border-royal-red text-royal-red hover:bg-royal-red hover:text-pastel-cream">
              <Link to="/reservations">Make Another Reservation</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReservationPage;