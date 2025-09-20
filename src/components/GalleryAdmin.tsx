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
import { Trash2, Upload, Edit } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { compressImage } from "@/utils/imageCompressor";

const formSchema = z.object({
  image: z.any().optional(),
  alt_text: z.string().min(2, "Alt text must be at least 2 characters."),
  description: z.string().optional(),
});

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  description?: string | null;
  sort_order: number;
  created_at: string;
}

const GalleryAdmin = () => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      alt_text: "",
      description: "",
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      alt_text: "",
      description: "",
    },
  });

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery_images")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching gallery images:", error);
      showError("Failed to load gallery images.");
    } else {
      setGalleryImages(data || []);
    }
    setLoading(false);
  };

  const handleAddSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    let imageFile = values.image?.[0];

    if (!imageFile) {
      showError("Please select an image to upload.");
      setIsSubmitting(false);
      return;
    }

    try {
      imageFile = await compressImage(imageFile);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

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
      
      const { error: insertError } = await supabase
        .from("gallery_images")
        .insert([{
          image_url: publicUrl,
          alt_text: values.alt_text,
          description: values.description,
        }]);

      if (insertError) {
        console.error("Error adding gallery image:", insertError);
        showError("Failed to add gallery image.");
      } else {
        showSuccess("Gallery image added successfully!");
        form.reset({ alt_text: "", description: "", image: undefined });
        fetchGalleryImages();
      }
    } catch (error) {
      // Error is handled by compressImage utility
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (image: GalleryImage) => {
    setEditingImage(image);
    editForm.reset({
      alt_text: image.alt_text,
      description: image.description || "",
      image: undefined,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!editingImage) return;

    setIsSubmitting(true);
    let imageUrl = editingImage.image_url;
    let imageFile = values.image?.[0];

    if (imageFile) {
      try {
        imageFile = await compressImage(imageFile);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `gallery/${fileName}`;

        const { error: uploadError } = await supabase.storage.from("assets").upload(filePath, imageFile);
        if (uploadError) {
          showError("Failed to upload new image.");
          setIsSubmitting(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(filePath);
        imageUrl = publicUrl;

        const oldFileName = editingImage.image_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage.from("assets").remove([`gallery/${oldFileName}`]);
        }
      } catch (error) {
        setIsSubmitting(false);
        return;
      }
    }

    const { error: updateError } = await supabase
      .from("gallery_images")
      .update({
        alt_text: values.alt_text,
        description: values.description,
        image_url: imageUrl,
      })
      .eq("id", editingImage.id);

    if (updateError) {
      showError("Failed to update gallery image.");
    } else {
      showSuccess("Gallery image updated successfully!");
      setEditDialogOpen(false);
      setEditingImage(null);
      fetchGalleryImages();
    }
    setIsSubmitting(false);
  };

  const handleDeleteImage = async (id: string, imageUrl: string) => {
    const fileName = imageUrl.split('/').pop();
    if (fileName) {
      await supabase.storage.from("assets").remove([`gallery/${fileName}`]);
    }

    const { error } = await supabase.from("gallery_images").delete().eq("id", id);
    if (error) {
      showError("Failed to delete gallery image.");
    } else {
      showSuccess("Gallery image deleted successfully.");
      fetchGalleryImages();
    }
  };

  if (loading) {
    return <div className="text-foreground">Loading gallery management...</div>;
  }

  return (
    <div className="space-y-8">
      <Card className="border-border bg-admin-card-bg shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Add New Gallery Image</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="image"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">Image File (Max 1MB)</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" {...rest} onChange={(e) => onChange(e.target.files)} className="border-border focus:border-brand-red focus:ring-brand-red" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alt_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">Alt Text</FormLabel>
                    <FormControl>
                      <Input placeholder="Descriptive text for the image" {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A short description of the image" rows={3} {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} className="bg-brand-red text-brand-red-foreground hover:bg-brand-red/90">
                {isSubmitting ? "Uploading..." : <><Upload className="mr-2 h-4 w-4" /> Add Image</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-border bg-admin-card-bg shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Existing Gallery Images</CardTitle>
        </CardHeader>
        <CardContent>
          {galleryImages.length === 0 ? (
            <p className="text-muted-foreground">No gallery images added yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {galleryImages.map((image) => (
                <div key={image.id} className="relative group overflow-hidden rounded-lg shadow-md border border-border">
                  <img src={image.image_url} alt={image.alt_text} className="w-full h-48 object-cover" />
                  <div className="p-3 bg-admin-card-bg">
                    <p className="font-medium text-foreground text-sm truncate">{image.alt_text}</p>
                    {image.description && <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{image.description}</p>}
                  </div>
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-2">
                    <Button variant="secondary" size="icon" onClick={() => handleEditClick(image)} className="bg-pastel-blue text-royal-red hover:bg-royal-gold hover:text-white">
                      <Edit className="h-5 w-5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="bg-brand-red hover:bg-brand-red/90">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-brand-red">Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            This action cannot be undone. This will permanently delete this gallery image.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteImage(image.id, image.image_url)} className="bg-brand-red text-brand-red-foreground hover:bg-brand-red/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingImage && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="w-[90vw] max-w-md bg-card border-border shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-brand-red text-lg font-semibold">Edit Gallery Image</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-6">
                <FormField
                  control={editForm.control}
                  name="alt_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-muted-foreground">Alt Text</FormLabel>
                      <FormControl>
                        <Input {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-muted-foreground">Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="image"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-muted-foreground">Replace Image (Max 1MB)</FormLabel>
                      <div className="my-2">
                        <img src={editingImage.image_url} alt="Current image" className="w-32 h-auto rounded-md object-cover border border-border" />
                        <p className="text-xs text-muted-foreground mt-1">Current Image</p>
                      </div>
                      <FormControl>
                        <Input type="file" accept="image/*" {...rest} onChange={(e) => onChange(e.target.files)} className="border-border focus:border-brand-red focus:ring-brand-red" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full bg-brand-red text-brand-red-foreground hover:bg-brand-red/90">
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GalleryAdmin;