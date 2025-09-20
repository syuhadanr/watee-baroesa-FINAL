"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  image: z.any().optional(),
});

const HeroImageAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      image: undefined,
    },
  });

  useEffect(() => {
    const fetchHeroContent = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("hero_content")
        .select("image_url")
        .single();

      if (data) {
        setCurrentImageUrl(data.image_url || null);
      }
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        showError("Failed to load hero image content.");
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
    let selectedImageId: string | null = null;

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

        const { data: newImage, error: insertImageError } = await supabase
          .from('hero_images')
          .insert([{ image_url: imageUrl, alt_text: "Hero Background" }])
          .select('id')
          .single();

        if (insertImageError) {
          showError("Failed to save new hero image reference.");
          console.error(insertImageError);
          setIsSubmitting(false);
          return;
        }
        selectedImageId = newImage.id;
      } catch (error) {
        setIsSubmitting(false);
        return;
      }
    }

    const updateData: { id: number; image_url: string | null; updated_at: string; selected_image_id?: string | null } = {
      id: 1,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    };

    if (selectedImageId) {
      updateData.selected_image_id = selectedImageId;
    }

    const { error } = await supabase
      .from("hero_content")
      .upsert(updateData, { onConflict: 'id' });

    if (error) {
      showError("Failed to update hero content.");
      console.error(error);
    } else {
      showSuccess("Hero content updated successfully.");
      setCurrentImageUrl(imageUrl);
      form.reset({ image: undefined });
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return <p className="text-foreground">Loading hero image editor...</p>;
  }

  return (
    <Card className="border-border bg-admin-card-bg shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Edit Hero Background Image</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

export default HeroImageAdmin;