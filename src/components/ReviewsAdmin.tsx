"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, Trash2, X } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import StarRating from './StarRating';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

const ReviewsAdmin = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showError('Failed to load reviews.');
      console.error('Error fetching reviews:', error);
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: true })
      .eq('id', id);

    if (error) {
      showError('Failed to approve review.');
    } else {
      showSuccess('Review approved!');
      fetchReviews();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('reviews').delete().eq('id', id);

    if (error) {
      showError('Failed to delete review.');
    } else {
      showSuccess('Review deleted.');
      fetchReviews();
    }
  };

  if (loading) {
    return <p>Loading reviews...</p>;
  }

  return (
    <Card className="bg-admin-card-bg shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Manage Guest Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Rating</TableHead>
                <TableHead className="text-muted-foreground">Comment</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="text-foreground whitespace-nowrap">
                    {format(parseISO(review.created_at), 'PPP')}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{review.name}</TableCell>
                  <TableCell>
                    <StarRating value={review.rating} size={16} isEditable={false} />
                  </TableCell>
                  <TableCell className="text-foreground max-w-sm whitespace-pre-wrap">
                    {review.comment}
                  </TableCell>
                  <TableCell>
                    <Badge variant={review.is_approved ? 'success' : 'secondary'}>
                      {review.is_approved ? 'Approved' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!review.is_approved && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-acehnese-green border-acehnese-green hover:bg-acehnese-green hover:text-white"
                          onClick={() => handleApprove(review.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 bg-brand-red hover:bg-brand-red/90"
                        onClick={() => handleDelete(review.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewsAdmin;