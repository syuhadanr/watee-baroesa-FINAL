"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
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
import { showSuccess, showError } from "@/utils/toast";
import RichTextEditor from "@/components/RichTextEditor"; // Import the new RichTextEditor

const formSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters."),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email address."),
  google_maps_embed_url: z.string().url("Please enter a valid URL for Google Maps embed.").optional().or(z.literal("")),
  opening_hours: z.string().optional(), // This will now store HTML
});

interface ContactInfo {
  id: number;
  address: string;
  phone?: string | null;
  email: string;
  google_maps_embed_url?: string | null;
  opening_hours?: string | null; // This will now store HTML
  updated_at: string;
}

const ContactAdmin = () => {
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      phone: "",
      email: "",
      google_maps_embed_url: "",
      opening_hours: "",
    },
  });

  useEffect(() => {
    const fetchContactInfo = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("contact_info")
        .select("*")
        .eq("id", 1) // Assuming a single entry with ID 1
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error("Error fetching contact info:", error);
        showError("Failed to load contact information.");
      } else if (data) {
        form.reset({
          address: data.address,
          phone: data.phone || "",
          email: data.email,
          google_maps_embed_url: data.google_maps_embed_url || "",
          opening_hours: data.opening_hours || "",
        });
      } else {
        form.reset({ address: "", phone: "", email: "", google_maps_embed_url: "", opening_hours: "" });
      }
      setLoading(false);
    };

    fetchContactInfo();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { error } = await supabase
      .from("contact_info")
      .upsert({
        id: 1, // Always update/insert the single entry with ID 1
        address: values.address,
        phone: values.phone || null,
        email: values.email,
        google_maps_embed_url: values.google_maps_embed_url || null,
        opening_hours: values.opening_hours || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      showError("Failed to update contact information.");
      console.error(error);
    } else {
      showSuccess("Contact information updated successfully.");
    }
  };

  if (loading) {
    return <div className="text-foreground">Loading contact info editor...</div>;
  }

  return (
    <Card className="border-border bg-admin-card-bg shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Manage Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Royal Street, Grand City, 10100" {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(123) 456-7890" {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
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
                  <FormLabel className="text-sm text-muted-foreground">Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@wateebaroesa.com" {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="opening_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Opening Hours</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="e.g., &lt;strong&gt;Tuesday - Sunday:&lt;/strong&gt; 11:00 AM - 10:00 PM&lt;br&gt;&lt;em&gt;Monday:&lt;/em&gt; Closed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="google_maps_embed_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Google Maps Embed URL (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste the Google Maps embed iframe src here (e.g., https://www.google.com/maps/embed?pb=!1m18...)"
                      rows={4}
                      {...field}
                      className="border-border focus:border-brand-red focus:ring-brand-red"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    To get the embed URL: Go to Google Maps, search for your location, click 'Share', then 'Embed a map', copy the `src` attribute from the `iframe` tag.
                  </p>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-brand-red text-brand-red-foreground hover:bg-brand-red/90">
              {form.formState.isSubmitting ? "Saving..." : "Save Contact Info"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ContactAdmin;