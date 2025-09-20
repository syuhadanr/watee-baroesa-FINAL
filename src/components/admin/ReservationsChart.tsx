"use client";

import React, { useState, useEffect } from 'react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Area } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, eachDayOfInterval, differenceInDays } from 'date-fns';
import { DateRange } from "react-day-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChartData {
  name: string;
  reservations: number;
}

const ReservationsChart = () => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservationData = async () => {
      if (!date?.from || !date?.to) {
        return;
      }

      setLoading(true);
      const startDate = date.from;
      const endDate = date.to;

      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const diff = differenceInDays(endDate, startDate);
      const labelFormat = diff > 14 ? 'dd/MM' : 'EEE';

      const initialData = dateRange.map(d => ({
        name: format(d, labelFormat),
        reservations: 0,
        fullDate: format(d, 'yyyy-MM-dd'),
      }));

      const { data, error } = await supabase
        .from('reservations')
        .select('date')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      if (error) {
        console.error('Error fetching reservation data for chart:', error);
      } else if (data) {
        const counts = data.reduce((acc, { date }) => {
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const finalData = initialData.map(day => ({
          ...day,
          reservations: counts[day.fullDate] || 0,
        }));
        
        setChartData(finalData);
      }
      setLoading(false);
    };

    fetchReservationData();
  }, [date]);

  if (loading && chartData.length === 0) { // Only show skeleton on initial load
    return (
      <Card className="bg-admin-card-bg shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Reservations Overview</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-admin-card-bg shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle className="text-lg font-semibold text-foreground">Reservations Overview</CardTitle>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full sm:w-[260px] justify-start text-left font-normal border-border focus:border-brand-red focus:ring-brand-red",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="pl-2">
        {loading ? (
          <div className="h-[350px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="colorReservations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--brand-red))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--brand-red))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Area type="monotone" dataKey="reservations" stroke="hsl(var(--brand-red))" fillOpacity={1} fill="url(#colorReservations)" />
              <Line type="monotone" dataKey="reservations" stroke="hsl(var(--brand-red))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ReservationsChart;