import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import RichTextEditor from "@/components/RichTextEditor";
import { compressImage } from "@/utils/imageCompressor";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  content: z.string().min(10, "Content must be at least 10 characters."),
  image: z.any().optional(),
});

interface AboutContent {
  id?: string;
  title: string;
  content: string;
  image_url?: string | null;
}

const AboutAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  useEffect(() => {
    const fetchAboutContent = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("about_sections")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching about content:", error);
        showError("Failed to load about content.");
      } else if (data) {
        form.reset({
          title: data.title,
          content: data.content,
        });
        setCurrentImageUrl(data.image_url);
      } else {
        form.reset({ title: "", content: "" });
        setCurrentImageUrl(null);
      }
      setLoading(false);
    };

    fetchAboutContent();
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
        const filePath = `about/${fileName}`;

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

    const { data: existingContent } = await supabase
      .from("about_sections")
      .select("id")
      .limit(1)
      .single();

    let error = null;
    if (existingContent) {
      const { error: updateError } = await supabase
        .from("about_sections")
        .update({ title: values.title, content: values.content, image_url: imageUrl })
        .eq("id", existingContent.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("about_sections")
        .insert([{ title: values.title, content: values.content, image_url: imageUrl }]);
      error = insertError;
    }

    if (error) {
      console.error("Error saving about content:", error);
      showError("Failed to save about content.");
    } else {
      showSuccess("About content saved successfully!");
      setCurrentImageUrl(imageUrl);
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return <div className="text-foreground">Loading about content...</div>;
  }

  return (
    <Card className="border-border bg-admin-card-bg shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Manage About Section</CardTitle>
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
                    <Input placeholder="Enter about section title" {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Content</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Tell the story of Watee Baroesa..."
                    />
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
                  <FormLabel className="text-sm text-muted-foreground">Section Image (Max 1MB)</FormLabel>
                  {currentImageUrl && (
                    <div className="my-2">
                      <img src={currentImageUrl} alt="Current about section image" className="w-48 h-auto rounded-md object-cover border border-border" />
                    </div>
                  )}
                  <FormControl>
                    <Input type="file" accept="image/*" {...rest} onChange={(e) => onChange(e.target.files)} className="border-border focus:border-brand-red focus:ring-brand-red" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="bg-brand-red text-brand-red-foreground hover:bg-brand-red/90">
              {isSubmitting ? "Saving..." : "Save About Content"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AboutAdmin;