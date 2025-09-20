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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { showSuccess, showError } from "@/utils/toast";
import { Trash2, Upload, Edit, LayoutGrid, List, Search, XCircle } from "lucide-react";
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
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  time_period: z.string().optional(),
  image: z.any().optional(),
});

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  time_period?: string | null;
  image_url?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const SpecialOffersAdmin = () => {
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (sessionStorage.getItem('offersViewMode') as 'grid' | 'list') || 'grid';
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    sessionStorage.setItem('offersViewMode', viewMode);
  }, [viewMode]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      time_period: "",
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      time_period: "",
    },
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("special_offers")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching special offers:", error);
      showError("Failed to load special offers.");
    } else {
      setOffers(data || []);
    }
    setLoading(false);
  };

  const handleAddSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    let imageUrl: string | null = null;
    let imageFile = values.image?.[0];

    if (imageFile) {
      try {
        imageFile = await compressImage(imageFile);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `offers/${fileName}`;

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

    const { error: insertError } = await supabase
      .from("special_offers")
      .insert([{
        title: values.title,
        description: values.description,
        time_period: values.time_period,
        image_url: imageUrl,
      }]);

    if (insertError) {
      console.error("Error adding special offer:", insertError);
      showError("Failed to add special offer.");
    } else {
      showSuccess("Special offer added successfully!");
      form.reset({ title: "", description: "", time_period: "", image: undefined });
      setCurrentImageUrl(null); // Clear current image preview for add form
      fetchOffers();
    }
    setIsSubmitting(false);
  };

  const handleEditClick = (offer: SpecialOffer) => {
    setEditingOffer(offer);
    editForm.reset({
      title: offer.title,
      description: offer.description,
      time_period: offer.time_period || "",
      image: undefined,
    });
    setCurrentImageUrl(offer.image_url || null); // Set current image for edit form
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!editingOffer) return;

    setIsSubmitting(true);
    let imageUrl = currentImageUrl;
    let imageFile = values.image?.[0];

    if (imageFile) {
      try {
        imageFile = await compressImage(imageFile);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `offers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("assets")
          .upload(filePath, imageFile);

        if (uploadError) {
          showError("Failed to upload new image.");
          console.error(uploadError);
          setIsSubmitting(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("assets")
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;

        // If updating and there was an old image, delete it
        if (editingOffer.image_url && editingOffer.image_url !== imageUrl) {
          const oldFileName = editingOffer.image_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from("assets").remove([`offers/${oldFileName}`]);
          }
        }
      } catch (error) {
        setIsSubmitting(false);
        return;
      }
    }

    const { error: updateError } = await supabase
      .from("special_offers")
      .update({
        title: values.title,
        description: values.description,
        time_period: values.time_period,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingOffer.id);

    if (updateError) {
      console.error("Error updating special offer:", updateError);
      showError("Failed to update special offer.");
    } else {
      showSuccess("Special offer updated successfully!");
      setEditDialogOpen(false);
      setEditingOffer(null);
      fetchOffers();
    }
    setIsSubmitting(false);
  };

  const handleDeleteOffer = async (id: string, imageUrl: string | null) => {
    if (imageUrl) {
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage.from("assets").remove([`offers/${fileName}`]);
      }
    }

    const { error } = await supabase.from("special_offers").delete().eq("id", id);
    if (error) {
      showError("Failed to delete special offer.");
    } else {
      showSuccess("Special offer deleted successfully.");
      fetchOffers();
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
  };

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch =
      offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {filteredOffers.map((offer) => (
        <Card key={offer.id} className="relative group overflow-hidden rounded-lg shadow-md border border-border flex flex-col">
          <AspectRatio ratio={9 / 16} className="bg-muted">
            <img src={offer.image_url || "/placeholder.svg"} alt={offer.title} className="w-full h-full object-cover" />
          </AspectRatio>
          <div className="p-3 bg-admin-card-bg flex-grow">
            <p className="font-medium text-foreground text-lg line-clamp-1">{offer.title}</p>
            {offer.time_period && <p className="text-royal-gold text-sm mt-1">{offer.time_period}</p>}
            <p className="text-muted-foreground text-sm mt-2 line-clamp-3">{offer.description}</p>
          </div>
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-2">
            <Button variant="secondary" size="icon" onClick={() => handleEditClick(offer)} className="bg-pastel-blue text-royal-red hover:bg-royal-gold hover:text-white">
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
                    This action cannot be undone. This will permanently delete this special offer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteOffer(offer.id, offer.image_url)} className="bg-brand-red text-brand-red-foreground hover:bg-brand-red/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <Card className="border-border bg-admin-card-bg shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-muted-foreground">Image</TableHead>
              <TableHead className="text-muted-foreground">Title</TableHead>
              <TableHead className="hidden md:table-cell text-muted-foreground">Description</TableHead>
              <TableHead className="hidden sm:table-cell text-muted-foreground">Time Period</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOffers.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell>
                  <img src={offer.image_url || '/placeholder.svg'} alt={offer.title} className="h-12 w-12 object-cover rounded-md border border-border" />
                </TableCell>
                <TableCell className="font-medium text-foreground">{offer.title}</TableCell>
                <TableCell className="hidden md:table-cell max-w-xs text-muted-foreground">
                  <p className="truncate">{offer.description}</p>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-foreground">{offer.time_period || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(offer)} className="text-foreground hover:bg-muted">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-brand-red hover:bg-muted hover:text-brand-red">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-brand-red">Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            This action cannot be undone. This will permanently delete the special offer "{offer.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteOffer(offer.id, offer.image_url)} className="bg-brand-red text-brand-red-foreground hover:bg-brand-red/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <Card className="border-border bg-admin-card-bg shadow-sm">
          <CardHeader><Skeleton className="h-6 w-48 mb-2" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border bg-admin-card-bg shadow-sm">
              <AspectRatio ratio={9 / 16} className="bg-muted">
                <Skeleton className="h-full w-full" />
              </AspectRatio>
              <CardHeader className="p-3 pb-0"><Skeleton className="h-5 w-3/4" /></CardHeader>
              <CardContent className="p-3 pt-0"><Skeleton className="h-4 w-full" /></CardContent>
              <CardFooter className="flex justify-end gap-2 p-3 pt-0">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Add New Special Offer Form */}
      <Card className="border-border bg-admin-card-bg shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Add New Special Offer</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">Offer Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Royal Happy Hour" {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
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
                      <Textarea placeholder="Detailed description of the offer" rows={4} {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time_period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">Time Period (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Weekdays, 4 PM - 6 PM" {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
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
                    <FormLabel className="text-sm text-muted-foreground">Offer Image (Max 1MB)</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" {...rest} onChange={(e) => onChange(e.target.files)} className="border-border focus:border-brand-red focus:ring-brand-red" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} className="bg-brand-red text-brand-red-foreground hover:bg-brand-red/90">
                {isSubmitting ? "Adding..." : <><Upload className="mr-2 h-4 w-4" /> Add Offer</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Existing Special Offers Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">Existing Special Offers</h2>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? "bg-brand-red text-brand-red-foreground hover:bg-brand-red/90" : "border-border text-foreground hover:bg-muted"}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')} className={viewMode === 'list' ? "bg-brand-red text-brand-red-foreground hover:bg-brand-red/90" : "border-border text-foreground hover:bg-muted"}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Bar for Special Offers */}
        <Card className="mb-6 border-border bg-admin-card-bg shadow-sm p-4">
          <CardContent className="p-0 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-border focus:border-brand-red focus:ring-brand-red"
              />
            </div>
            {searchTerm && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleClearFilters} className="border-border text-foreground hover:bg-muted">
                  <XCircle className="h-4 w-4 mr-2" /> Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {filteredOffers.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg border-border text-muted-foreground">
            <p className="mb-4">No special offers found matching your filters.</p>
            {searchTerm && (
              <Button onClick={handleClearFilters} variant="outline" className="border-border text-foreground hover:bg-muted">
                <XCircle className="h-4 w-4 mr-2" /> Clear Filters
              </Button>
            )}
          </div>
        ) : (
          viewMode === 'grid' ? renderGridView() : renderListView()
        )}
      </div>

      {/* Edit Offer Dialog */}
      {editingOffer && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="w-[90vw] max-w-md bg-card border-border shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-brand-red text-lg font-semibold">Edit Special Offer</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-6">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-muted-foreground">Offer Title</FormLabel>
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
                      <FormLabel className="text-sm text-muted-foreground">Description</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="time_period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-muted-foreground">Time Period (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} className="border-border focus:border-brand-red focus:ring-brand-red" />
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
                      <FormLabel className="text-sm text-muted-foreground">New Offer Image (Max 1MB)</FormLabel>
                      {currentImageUrl && (
                        <div className="my-2">
                          <img src={currentImageUrl} alt="Current offer image" className="w-32 h-auto rounded-md object-cover border border-border" />
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

export default SpecialOffersAdmin;