import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Clock, Undo2, Eye, CheckCircle, XCircle, Search, Calendar as CalendarIcon, XCircle as ClearFilterIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import HeroAdmin from "@/components/HeroAdmin";
import AboutAdmin from "@/components/AboutAdmin";
import GalleryAdmin from "@/components/GalleryAdmin";
import SpecialOffersAdmin from "@/components/SpecialOffersAdmin";
import ContactAdmin from "@/components/ContactAdmin";
import MenuItems from "@/components/admin/MenuItems"; // Updated import path
import DashboardAdmin from "@/components/DashboardAdmin";
import ReviewsAdmin from "@/components/ReviewsAdmin";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { tableOptions } from "@/lib/tableOptions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

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
  notes?: string | null;
  payment_status: 'Pending' | 'Deposit' | 'Paid' | 'Rejected';
  total_bill?: number | null;
  deposit_amount?: number | null;
  deposit_percentage?: number | null;
  check_in_time?: string | null;
  payment_proof_url?: string | null;
  qr_payload?: string | null;
  confirmed_at?: string | null;
  confirmed_by?: string | null;
  rejected_at?: string | null;
  rejected_by?: string | null;
  rejection_reason?: string | null;
  invoice_no?: string | null;
  invoice_issued_at?: string | null;
}

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const AdminPage = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof Reservation } | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  const [showProofModal, setShowProofModal] = useState(false);
  const [currentProofUrl, setCurrentProofUrl] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [currentReservationIdForAction, setCurrentReservationIdForAction] = useState<string | null>(null);

  // Filter states for reservations
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<Reservation['status'] | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined);
  const [tableFilter, setTableFilter] = useState<string | 'all'>('all');

  const { session } = useAuth();
  const adminEmail = session?.user?.email || 'Unknown Admin';

  const location = useLocation();
  const activeSection = location.hash ? location.hash.substring(1) : "dashboard";

  const sectionTitles: { [key: string]: string } = {
    dashboard: "Dashboard",
    hero: "Hero Section Management",
    about: "About Section Management",
    menu: "Menu Management",
    gallery: "Gallery Management",
    offers: "Special Offers Management",
    contact: "Contact Info Management",
    reservations: "Reservations Management",
    reviews: "Guest Reviews Management",
    subscribers: "Newsletter Subscribers",
  };

  const pageTitle = sectionTitles[activeSection] || "Admin";

  const fetchData = async () => {
    setLoading(true);
    // Fetch reservations
    const { data: reservationsData, error: reservationsError } = await supabase
      .from("reservations")
      .select("*")
      .order("date", { ascending: false })
      .order("time", { ascending: false });
    if (reservationsError) showError("Failed to load reservations.");
    else setReservations(reservationsData || []);

    // Fetch subscribers
    const { data: subscribersData, error: subscribersError } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    if (subscribersError) showError("Failed to load subscribers.");
    else setSubscribers(subscribersData || []);
    
    setLoading(false);
  };

  useEffect(() => {
    if (activeSection === "reservations" || activeSection === "subscribers") {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [activeSection]);

  const handleEditClick = (id: string, field: keyof Reservation, currentValue: any) => {
    setEditingCell({ id, field });
    setEditValue(currentValue);
  };

  const handleSaveEdit = async (id: string, field: keyof Reservation, value: any) => {
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return;

    let valueToSave = value;
    const updatePayload: Partial<Reservation> = {};

    if (field === 'deposit_percentage') {
      valueToSave = parseFloat(value);
      if (isNaN(valueToSave) || valueToSave < 0) { // Allow 0 for manual adjustment
        showError("Deposit percentage must be a valid number.");
        setEditingCell(null);
        return;
      }
      const totalBill = reservation.total_bill || 0;
      updatePayload.deposit_amount = (totalBill * valueToSave) / 100;
      updatePayload.deposit_percentage = valueToSave;
      
      if (valueToSave >= 100) {
        updatePayload.payment_status = 'Paid';
      } else if (valueToSave > 0) {
        updatePayload.payment_status = 'Deposit';
      } else {
        updatePayload.payment_status = 'Pending'; // If deposit is 0
      }
    } else {
      updatePayload[field] = valueToSave;
    }

    if (field === 'status' && valueToSave === 'Arrived' && !reservation.check_in_time) {
      updatePayload.check_in_time = new Date().toISOString();
    }

    const { error } = await supabase
      .from('reservations')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      showError(`Failed to update ${String(field)}. ${error.message}`);
    } else {
      showSuccess(`${String(field)} updated.`);
      fetchData();
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleUndoCheckIn = async (id: string) => {
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'Confirmed', check_in_time: null })
      .eq('id', id);

    if (error) showError("Failed to undo check-in.");
    else {
      showSuccess("Check-in undone.");
      fetchData();
    }
  };

  const handleDeleteReservation = async (id: string) => {
    const { error } = await supabase.from("reservations").delete().eq("id", id);
    if (error) showError("Failed to delete reservation.");
    else {
      showSuccess("Reservation deleted successfully.");
      fetchData();
    }
  };

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

  const getPaymentBadgeInfo = (res: Reservation) => {
    if (res.payment_status === 'Paid') return { variant: 'success' as const, text: 'Paid' };
    if (res.payment_status === 'Deposit') {
      const percentage = res.deposit_percentage || 0;
      return { variant: 'royal-gold' as const, text: `Deposit (${percentage.toFixed(0)}%)` };
    }
    if (res.payment_status === 'Rejected') return { variant: 'destructive' as const, text: 'Rejected' };
    return { variant: 'secondary' as const, text: 'Pending' };
  };

  const handleViewProof = (url: string | null) => {
    if (url) {
      setCurrentProofUrl(url);
      setShowProofModal(true);
    } else {
      showError("No payment proof available.");
    }
  };

  const handleConfirmPayment = async (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    const totalBill = reservation.total_bill || 0;
    const depositAmount = reservation.deposit_amount || 0;
    let newPaymentStatus: Reservation['payment_status'] = 'Pending';

    if (totalBill > 0) {
      if (depositAmount >= totalBill) {
        newPaymentStatus = 'Paid';
      } else if (depositAmount > 0) {
        newPaymentStatus = 'Deposit';
      }
    }

    let newStatus = reservation.status;
    if (newStatus === 'Pending' || newStatus === 'Rejected') {
      newStatus = 'Confirmed';
    }

    const { error } = await supabase
      .from('reservations')
      .update({
        payment_status: newPaymentStatus,
        status: newStatus,
        confirmed_at: new Date().toISOString(),
        confirmed_by: adminEmail,
        rejected_at: null, // Clear rejection info if confirmed
        rejected_by: null,
        rejection_reason: null,
      })
      .eq('id', reservationId);

    if (error) {
      showError("Failed to confirm payment.");
      console.error(error);
    } else {
      showSuccess("Payment confirmed and reservation updated!");
      fetchData();
    }
  };

  const handleRejectClick = (reservationId: string) => {
    setCurrentReservationIdForAction(reservationId);
    setRejectReason(''); // Clear previous reason
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!currentReservationIdForAction || !rejectReason.trim()) {
      showError("Rejection reason is required.");
      return;
    }

    const { error } = await supabase
      .from('reservations')
      .update({
        status: 'Rejected',
        payment_status: 'Rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: adminEmail,
        rejection_reason: rejectReason.trim(),
        confirmed_at: null, // Clear confirmation info if rejected
        confirmed_by: null,
      })
      .eq('id', currentReservationIdForAction);

    if (error) {
      showError("Failed to reject reservation.");
      console.error(error);
    } else {
      showSuccess("Reservation rejected.");
      setShowRejectModal(false);
      setCurrentReservationIdForAction(null);
      setRejectReason('');
      fetchData();
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter(undefined);
    setTableFilter('all');
  };

  const filteredReservations = reservations.filter(res => {
    const matchesSearch =
      searchQuery === '' ||
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.phone && res.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (res.message && res.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (res.notes && res.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (res.invoice_no && res.invoice_no.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || res.status === statusFilter;

    const matchesDate =
      !dateFilter?.from ||
      !dateFilter?.to ||
      (parseISO(res.date) >= dateFilter.from && parseISO(res.date) <= dateFilter.to);

    const matchesTable =
      tableFilter === 'all' || res.table_number === tableFilter;

    return matchesSearch && matchesStatus && matchesDate && matchesTable;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground mb-8">{pageTitle}</h1>
      
      {loading && <p>Loading...</p>}

      {!loading && (
        <>
          {activeSection === "dashboard" && <DashboardAdmin />}
          {activeSection === "hero" && (
            <div id="hero" className="mb-8">
              <HeroAdmin />
            </div>
          )}
          {activeSection === "about" && (
            <div id="about" className="mb-8">
              <AboutAdmin />
            </div>
          )}
          {activeSection === "menu" && (
            <div id="menu" className="mb-8">
              <MenuItems /> {/* Using the new MenuItems component */}
            </div>
          )}
          {activeSection === "gallery" && (
            <div id="gallery" className="mb-8">
              <GalleryAdmin />
            </div>
          )}
          {activeSection === "offers" && (
            <div id="offers" className="mb-8">
              <SpecialOffersAdmin />
            </div>
          )}
          {activeSection === "contact" && (
            <div id="contact" className="mb-8">
              <ContactAdmin />
            </div>
          )}
          {activeSection === "reviews" && (
            <div id="reviews" className="mb-8">
              <ReviewsAdmin />
            </div>
          )}
          {activeSection === "reservations" && (
            <div id="reservations" className="mb-8">
              {/* Filter Bar for Reservations */}
              <Card className="mb-6 border-border bg-admin-card-bg shadow-sm p-4">
                <CardContent className="p-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email, invoice, notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 border-border focus:border-brand-red focus:ring-brand-red"
                      />
                    </div>

                    {/* Status Filter */}
                    <Select onValueChange={(value: Reservation['status'] | 'all') => setStatusFilter(value)} value={statusFilter}>
                      <SelectTrigger className="border-border focus:border-brand-red focus:ring-brand-red">
                        <SelectValue placeholder="Filter by Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-foreground">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                        <SelectItem value="Arrived">Arrived</SelectItem>
                        <SelectItem value="Canceled">Canceled</SelectItem>
                        <SelectItem value="No-show">No-show</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Date Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal border-border focus:border-brand-red focus:ring-brand-red",
                            !dateFilter && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFilter?.from ? (
                            dateFilter.to ? (
                              <>
                                {format(dateFilter.from, "LLL dd, y")} -{" "}
                                {format(dateFilter.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateFilter.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Filter by Date Range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateFilter?.from}
                          selected={dateFilter}
                          onSelect={setDateFilter}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Table Number Filter */}
                    <Select onValueChange={(value: string | 'all') => setTableFilter(value)} value={tableFilter}>
                      <SelectTrigger className="border-border focus:border-brand-red focus:ring-brand-red">
                        <SelectValue placeholder="Filter by Table" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-foreground">
                        <SelectItem value="all">All Tables</SelectItem>
                        {tableOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(searchQuery || statusFilter !== 'all' || dateFilter?.from || dateFilter?.to || tableFilter !== 'all') && (
                    <div className="flex justify-end">
                      <Button variant="outline" onClick={handleClearFilters} className="border-border text-foreground hover:bg-muted">
                        <ClearFilterIcon className="h-4 w-4 mr-2" /> Clear Filters
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-admin-card-bg shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Reservations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[180px] text-muted-foreground">Guest / Invoice</TableHead>
                          <TableHead className="min-w-[120px] text-muted-foreground">Date & Time</TableHead>
                          <TableHead className="min-w-[80px] text-muted-foreground">Guests</TableHead>
                          <TableHead className="min-w-[150px] text-muted-foreground">Status</TableHead>
                          <TableHead className="min-w-[100px] text-muted-foreground">Table</TableHead>
                          <TableHead className="min-w-[200px] text-muted-foreground">Notes</TableHead>
                          <TableHead className="min-w-[120px] text-muted-foreground">Total Bill</TableHead>
                          <TableHead className="min-w-[150px] text-muted-foreground">Payment</TableHead>
                          <TableHead className="min-w-[200px] text-muted-foreground">Check-in</TableHead>
                          <TableHead className="min-w-[180px] text-muted-foreground">Admin Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReservations.map((res) => {
                          const isFinalStatus = ['Arrived', 'Canceled', 'No-show'].includes(res.status);
                          const isEditing = editingCell?.id === res.id;
                          const paymentInfo = getPaymentBadgeInfo(res);
                          const canConfirmPayment = res.payment_proof_url && res.payment_status !== 'Paid' && res.status !== 'Arrived' && res.status !== 'Canceled' && res.status !== 'Confirmed';
                          const canReject = res.status !== 'Arrived' && res.status !== 'Canceled' && res.status !== 'Rejected';

                          return (
                            <TableRow key={res.id} className={isFinalStatus ? 'bg-muted/50' : 'hover:bg-muted'}>
                              <TableCell>
                                <p className="font-medium text-foreground">{res.name}</p>
                                <p className="text-xs text-muted-foreground">{res.email}</p>
                                {res.invoice_no && <p className="text-xs font-mono text-muted-foreground mt-1">{res.invoice_no}</p>}
                              </TableCell>
                              <TableCell className="text-foreground">
                                {format(parseISO(res.date), "PPP")} at {res.time}
                              </TableCell>
                              <TableCell className="text-foreground">{res.guests}</TableCell>
                              <TableCell>
                                {isEditing && editingCell.field === 'status' ? (
                                  <Select
                                    value={editValue}
                                    onValueChange={(val: Reservation['status']) => handleSaveEdit(res.id, 'status', val)}
                                  >
                                    <SelectTrigger className="w-[140px] h-8 border-border focus:border-brand-red focus:ring-brand-red"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-popover border-border text-foreground">
                                      <SelectItem value="Pending">Pending</SelectItem>
                                      <SelectItem value="Confirmed">Confirmed</SelectItem>
                                      <SelectItem value="Arrived">Arrived</SelectItem>
                                      <SelectItem value="Canceled">Canceled</SelectItem>
                                      <SelectItem value="No-show">No-show</SelectItem>
                                      <SelectItem value="Rejected">Rejected</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge
                                    variant={getStatusBadgeVariant(res.status)}
                                    onClick={() => !isFinalStatus && handleEditClick(res.id, 'status', res.status)}
                                    className={!isFinalStatus ? "cursor-pointer hover:opacity-80" : ""}
                                  >
                                    {res.status}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing && editingCell.field === 'table_number' ? (
                                  <Select
                                    value={editValue || ''}
                                    onValueChange={(val) => handleSaveEdit(res.id, 'table_number', val)}
                                  >
                                    <SelectTrigger className="w-[120px] h-8 border-border focus:border-brand-red focus:ring-brand-red">
                                      <SelectValue placeholder="Select Table" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border text-foreground">
                                      {tableOptions.map(option => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span onClick={() => !isFinalStatus && handleEditClick(res.id, 'table_number', res.table_number || '')} className={`text-foreground ${!isFinalStatus ? "cursor-pointer hover:text-brand-red" : ""}`}>
                                    {res.table_number || 'N/A'}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing && editingCell.field === 'notes' ? (
                                  <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => handleSaveEdit(res.id, 'notes', editValue)} autoFocus className="w-[180px] h-16 border-border focus:border-brand-red focus:ring-brand-red" />
                                ) : (
                                  <span onClick={() => !isFinalStatus && handleEditClick(res.id, 'notes', res.notes || '')} className={`text-xs whitespace-pre-wrap text-muted-foreground ${!isFinalStatus ? "cursor-pointer hover:text-brand-red" : ""}`}>
                                    {res.notes || 'N/A'}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-foreground">{formatCurrency(res.total_bill)}</TableCell>
                              <TableCell>
                                {isEditing && editingCell.field === 'deposit_percentage' ? (
                                  <Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => handleSaveEdit(res.id, 'deposit_percentage', editValue)} autoFocus className="w-[90px] h-8 border-border focus:border-brand-red focus:ring-brand-red" />
                                ) : (
                                  paymentInfo && (
                                    <Badge
                                      variant={paymentInfo.variant}
                                      onClick={() => !isFinalStatus && handleEditClick(res.id, 'deposit_percentage', res.deposit_percentage || 0)}
                                      className={!isFinalStatus ? "cursor-pointer hover:opacity-80" : ""}
                                    >
                                      {paymentInfo.text}
                                    </Badge>
                                  )
                                )}
                                {res.payment_status === 'Rejected' && res.rejection_reason && (
                                  <p className="text-xs text-destructive mt-1">Reason: {res.rejection_reason}</p>
                                )}
                              </TableCell>
                              <TableCell>
                                {res.check_in_time ? (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="success" className="bg-acehnese-green text-white">{format(parseISO(res.check_in_time), "HH:mm")}</Badge>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-muted" onClick={() => handleUndoCheckIn(res.id)}>
                                          <Undo2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-card text-foreground border-border">
                                        <p>Undo Check-in</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                ) : !isFinalStatus && res.status === 'Confirmed' ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="secondary" size="sm" onClick={() => handleSaveEdit(res.id, 'status', 'Arrived')} className="bg-muted text-foreground hover:bg-muted/80">
                                        <Clock className="h-4 w-4 mr-2" /> Mark Arrived
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-card text-foreground border-border">
                                      <p>Mark as Arrived</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  {res.payment_proof_url && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => handleViewProof(res.payment_proof_url)} className="h-8 w-8 border-border text-foreground hover:bg-muted">
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-card text-foreground border-border">
                                        <p>View Proof</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {canConfirmPayment && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="default" size="icon" onClick={() => handleConfirmPayment(res.id)} className="h-8 w-8 bg-acehnese-green text-white hover:bg-acehnese-green/90">
                                          <CheckCircle className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-card text-foreground border-border">
                                        <p>Approve Payment</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {canReject && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="destructive" size="icon" onClick={() => handleRejectClick(res.id)} className="h-8 w-8 bg-brand-red hover:bg-brand-red/90">
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-card text-foreground border-border">
                                        <p>Reject Payment</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  <AlertDialog>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="destructive" size="icon" className="bg-brand-red hover:bg-brand-red/90 h-8 w-8">
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-card text-foreground border-border">
                                        <p>Delete Reservation</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <AlertDialogContent className="bg-card border-border">
                                      <AlertDialogHeader><AlertDialogTitle className="text-brand-red">Are you sure?</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground">This will permanently delete the reservation.</AlertDialogDescription></AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteReservation(res.id)} className="bg-brand-red text-brand-red-foreground hover:bg-brand-red/90">Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {activeSection === "subscribers" && (
            <div id="subscribers" className="mb-8">
              <Card className="bg-admin-card-bg shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Newsletter Subscribers</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-muted-foreground">Email</TableHead>
                        <TableHead className="text-muted-foreground">Subscribed On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((sub) => (
                        <TableRow key={sub.id} className="hover:bg-muted">
                          <TableCell className="text-foreground">{sub.email}</TableCell>
                          <TableCell className="text-foreground">{format(parseISO(sub.created_at), "PPP")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Proof View Modal */}
      <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
        <DialogContent className="max-w-3xl bg-card border-border p-6">
          <DialogHeader>
            <DialogTitle className="text-brand-red">Payment Proof</DialogTitle>
          </DialogHeader>
          {currentProofUrl && (
            <div className="mt-4">
              {currentProofUrl.endsWith('.pdf') ? (
                <iframe src={currentProofUrl} className="w-full h-[70vh] border-none" title="Payment Proof PDF"></iframe>
              ) : (
                <img src={currentProofUrl} alt="Payment Proof" className="max-w-full h-auto mx-auto object-contain" />
              )}
              <div className="flex justify-center mt-4">
                <Button asChild className="bg-brand-red text-brand-red-foreground hover:bg-brand-red/90">
                  <a href={currentProofUrl} target="_blank" rel="noopener noreferrer" download>Download Proof</a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reservation Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-md bg-card border-border p-6">
          <DialogHeader>
            <DialogTitle className="text-brand-red">Reject Reservation</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <p className="text-muted-foreground">Please provide a reason for rejecting this reservation.</p>
            <Textarea
              placeholder="e.g., Payment proof invalid, no tables available, etc."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="border-border focus:border-brand-red focus:ring-brand-red"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRejectModal(false)} className="border-border text-foreground hover:bg-muted">
                Cancel
              </Button>
              <Button onClick={handleRejectSubmit} disabled={!rejectReason.trim()} className="bg-brand-red text-brand-red-foreground hover:bg-brand-red/90">
                Reject Reservation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;