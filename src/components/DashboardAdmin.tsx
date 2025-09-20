import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, DollarSign, Users, Star, ArrowRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { Skeleton } from './ui/skeleton';
import ReservationsChart from './admin/ReservationsChart'; // Import the new chart component

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const StatCard = ({ title, value, icon: Icon, link, linkText }) => (
  <Card className="bg-admin-card-bg shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {link && (
        <Link to={link} className="text-xs text-muted-foreground hover:text-brand-red flex items-center mt-1">
          {linkText} <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      )}
    </CardContent>
  </Card>
);

interface Reservation {
  id: string;
  name: string;
  date: string;
  time: string;
  guests: number;
  status: 'Pending' | 'Confirmed' | 'Arrived' | 'Canceled' | 'No-show' | 'Rejected';
}

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const DashboardAdmin = () => {
  const [stats, setStats] = useState({
    todayReservations: 0,
    pendingReservations: 0,
    monthlyRevenue: 0,
    newSubscribers: 0,
  });
  const [latestReservations, setLatestReservations] = useState<Reservation[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      const monthStartISO = startOfMonth(new Date()).toISOString();
      const monthEndISO = endOfMonth(new Date()).toISOString();

      try {
        const [
          todayRes,
          pendingRes,
          revenueRes,
          subscribersRes,
          latestRes,
          pendingRev,
        ] = await Promise.all([
          supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('date', today),
          supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
          supabase.from('reservations').select('total_bill').in('status', ['Confirmed', 'Arrived']).gte('date', monthStart).lte('date', monthEnd),
          supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).gte('created_at', monthStartISO).lte('created_at', monthEndISO),
          supabase.from('reservations').select('id, name, date, time, guests, status').order('created_at', { ascending: false }).limit(5),
          supabase.from('reviews').select('id, name, rating, comment, created_at').eq('is_approved', false).order('created_at', { ascending: false }).limit(5),
        ]);

        const totalRevenue = revenueRes.data?.reduce((sum, item) => sum + (item.total_bill || 0), 0) || 0;
        
        setStats({
          todayReservations: todayRes.count || 0,
          pendingReservations: pendingRes.count || 0,
          monthlyRevenue: totalRevenue,
          newSubscribers: subscribersRes.count || 0,
        });

        setLatestReservations(latestRes.data || []);
        setPendingReviews(pendingRev.data || []);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadgeVariant = (status: Reservation['status']) => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'Confirmed': return 'default';
      case 'Arrived': return 'success';
      case 'Canceled': return 'destructive';
      case 'No-show': return 'warning';
      case 'Rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Reservations" value={stats.todayReservations} icon={Calendar} link="/admin#reservations" linkText="View all reservations" />
        <StatCard title="Pending Reservations" value={stats.pendingReservations} icon={Clock} link="/admin#reservations" linkText="Manage reservations" />
        <StatCard title="This Month's Revenue" value={formatCurrency(stats.monthlyRevenue)} icon={DollarSign} link="/admin#reservations" linkText="View payment details" />
        <StatCard title="New Subscribers" value={stats.newSubscribers} icon={Users} link="/admin#subscribers" linkText="View subscribers" />
      </div>

      <ReservationsChart />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 bg-admin-card-bg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">Latest Reservations</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin#reservations">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">Guest</TableHead>
                  <TableHead className="text-muted-foreground">Date & Time</TableHead>
                  <TableHead className="text-right text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestReservations.length > 0 ? latestReservations.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{res.name}</div>
                      <div className="text-sm text-muted-foreground">{res.guests} guest(s)</div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {format(parseISO(res.date), "PPP")} at {res.time}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getStatusBadgeVariant(res.status)}>{res.status}</Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">No recent reservations.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 bg-admin-card-bg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">Pending Reviews</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin#reviews">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingReviews.length > 0 ? pendingReviews.map((review) => (
                <div key={review.id} className="flex items-start space-x-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none text-foreground">{review.name}</p>
                      <StarRating value={review.rating} size={16} isEditable={false} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center text-muted-foreground h-24 flex items-center justify-center">No pending reviews.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardAdmin;