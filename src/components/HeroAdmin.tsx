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
import { compressImage } from "@/utils/imageCompressor";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  subtitle: z.string().optional(),
  image: z.any().optional(),
});

const HeroAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      subtitle: "",
    },
  });

  useEffect(() => {
    const fetchHeroContent = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("hero_content")
        .select("*")
        .single();

      if (data) {
        form.reset({
          title: data.title,
          subtitle: data.subtitle,
        });
        setCurrentImageUrl(data.image_url);
      }
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        showError("Failed to load hero content.");
        console.error(error);
      }
      setLoading(false);
    };

    fetchHeroContent();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    let imageUrl = currentImageUrl;
    let imageFile = values.image?.[0];

    if (imageFile) {
      try {
        imageFile = await compressImage(imageFile);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `hero/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("assets")
          .upload(filePath, imageFile);

        if (uploadError) {
          showError("Failed to upload image.");
          console.error(uploadError);
          setIsSubmitting(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("assets")
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      } catch (error) {
        setIsSubmitting(false);
        return;
      }
    }

    const { error } = await supabase
      .from("hero_content")
      .upsert({
        id: 1,
        title: values.title,
        subtitle: values.subtitle,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .single();

    if (error) {
      showError("Failed to update hero content.");
      console.error(error);
    } else {
      showSuccess("Hero content updated successfully.");
      setCurrentImageUrl(imageUrl);
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return <p className="text-foreground">Loading hero content editor...</p>;
  }

  return (
    <Card className="border-border bg-admin-card-bg shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Edit Hero Section</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Hero Title" {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Subtitle</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Hero Subtitle" {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Background Image (Max 1MB)</FormLabel>
                  {currentImageUrl && <img src={currentImageUrl} alt="Current hero background" className="w-48 h-auto rounded-md my-2 object-cover border border-border" />}
                  <FormControl>
                    <Input type="file" accept="image/*" {...rest} onChange={(e) => onChange(e.target.files)} className="border-border focus:border-brand-red focus:ring-brand-red" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="bg-brand-red text-brand-red-foreground hover:bg-brand-red/90">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default HeroAdmin;