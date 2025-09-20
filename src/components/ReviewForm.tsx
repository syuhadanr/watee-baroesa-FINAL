"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import StarRating from './StarRating';
import { showSuccess, showError } from '@/utils/toast';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  rating: z.number().min(1, 'Please provide a rating.').max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters.'),
});

interface ReviewFormProps {
  onSuccess: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSuccess }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      rating: 0,
      comment: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { error } = await supabase.from('reviews').insert([
      {
        name: values.name,
        rating: values.rating,
        comment: values.comment,
      },
    ]);

    if (error) {
      showError('Failed to submit review. Please try again.');
      console.error('Review submission error:', error);
    } else {
      showSuccess('Review submitted! It will appear after approval.');
      form.reset();
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-royal-red">Your Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} className="border-royal-red focus:border-royal-gold" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-royal-red">Your Rating</FormLabel>
              <FormControl>
                <StarRating value={field.value} onChange={field.onChange} size={32} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-royal-red">Your Review</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your experience..."
                  rows={5}
                  {...field}
                  className="border-royal-red focus:border-royal-gold"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red">
          {form.formState.isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </form>
    </Form>
  );
};

export default ReviewForm;