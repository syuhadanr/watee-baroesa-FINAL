"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { compressImage } from "@/utils/imageCompressor";
// import { ArrowLeft } from "lucide-react"; // Removed as per request

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  price: z.string().min(3, { message: "Price is required." }),
  category: z.enum(["appetizer", "main", "dessert", "drink"], { message: "Please select a category." }),
  type: z.enum(["acehnese", "french", "other"], { message: "Please select a cuisine type." }),
  image: z.any().optional(),
});

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: "appetizer" | "main" | "dessert" | "drink";
  type: "acehnese" | "french" | "other";
  image_url?: string | null;
  sort_order?: number | null;
  created_at?: string;
  updated_at?: string;
}

interface MenuItemFormProps {
  item?: MenuItem | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Define a type for the ref handle
export interface MenuItemFormRef {
  resetForm: () => void;
}

const formatPrice = (value: string) => {
  if (!value) return "";
  const numberValue = parseInt(value.replace(/[^0-9]/g, ""), 10);
  if (isNaN(numberValue)) return "";
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(numberValue);
};

const MenuItemForm = forwardRef<MenuItemFormRef, MenuItemFormProps>(({ item, onSuccess, onCancel }, ref) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(item?.image_url || null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name || "",
      description: item?.description || "",
      price: item?.price || "",
      category: item?.category || "main",
      type: item?.type || "acehnese",
      image: undefined,
    },
  });

  // Expose resetForm method via ref
  useImperativeHandle(ref, () => ({
    resetForm() {
      form.reset({
        name: "",
        description: "",
        price: "",
        category: "main",
        type: "acehnese",
        image: undefined,
      });
      setCurrentImageUrl(null);
    }
  }));

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        type: item.type,
        image: undefined,
      });
      setCurrentImageUrl(item.image_url || null);
    } else {
      // Only reset if it's a new item form, otherwise keep current values for editing
      form.reset({
        name: "",
        description: "",
        price: "",
        category: "main",
        type: "acehnese",
        image: undefined,
      });
      setCurrentImageUrl(null);
    }
  }, [item, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    let imageUrl = currentImageUrl;
    let imageFile = values.image?.[0];

    if (imageFile) {
      try {
        imageFile = await compressImage(imageFile);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `menu/${fileName}`;

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

        // If updating and there was an old image, delete it
        if (item?.image_url && item.image_url !== imageUrl) {
          const oldFileName = item.image_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from("assets").remove([`menu/${oldFileName}`]);
          }
        }
      } catch (error) {
        setIsSubmitting(false);
        return;
      }
    }

    if (item) {
      // Update existing item
      const { error: updateError } = await supabase
        .from("menu_items")
        .update({
          name: values.name,
          description: values.description,
          price: values.price,
          category: values.category,
          type: values.type,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (updateError) {
        console.error("Error updating menu item:", updateError);
        showError("Failed to update menu item.");
      } else {
        showSuccess("Menu item updated successfully!");
        onSuccess();
      }
    } else {
      // Add new item
      const { error: insertError } = await supabase
        .from("menu_items")
        .insert([{
          name: values.name,
          description: values.description,
          price: values.price,
          category: values.category,
          type: values.type,
          image_url: imageUrl,
        }]);

      if (insertError) {
        console.error("Error adding menu item:", insertError);
        showError("Failed to add menu item.");
      } else {
        showSuccess("Menu item added successfully!");
        onSuccess();
      }
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="border-border bg-admin-card-bg shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">{item ? "Edit Menu Item" : "Add New Menu Item"}</CardTitle>
        {item && ( // Only show "Back to Menu Items" button if in edit mode
          <Button variant="outline" size="sm" onClick={onCancel}>
            Back to Menu Items
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Mie Aceh Royale" {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
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
                  <FormLabel className="text-sm text-muted-foreground">Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detailed description of the dish" rows={3} {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Price</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 100000"
                      {...field}
                      onChange={(e) => {
                        const formattedValue = formatPrice(e.target.value);
                        field.onChange(formattedValue);
                      }}
                      className="border-border focus:border-brand-red focus:ring-brand-red"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-border focus:border-brand-red focus:ring-brand-red">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border text-foreground">
                        <SelectItem value="appetizer">Appetizer</SelectItem>
                        <SelectItem value="main">Main Course</SelectItem>
                        <SelectItem value="dessert">Dessert</SelectItem>
                        <SelectItem value="drink">Drink</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">Cuisine Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-border focus:border-brand-red focus:ring-brand-red">
                          <SelectValue placeholder="Select a cuisine type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border text-foreground">
                        <SelectItem value="acehnese">Acehnese</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="image"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Item Image (Max 1MB)</FormLabel>
                  {currentImageUrl && (
                    <div className="my-2">
                      <img src={currentImageUrl} alt="Current item image" className="w-32 h-auto rounded-md object-cover border border-border" />
                      <p className="text-xs text-muted-foreground mt-1">Current Image</p>
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
              {isSubmitting ? (item ? "Saving Changes..." : "Adding Item...") : (item ? "Save Changes" : "Add Menu Item")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
});

export default MenuItemForm;