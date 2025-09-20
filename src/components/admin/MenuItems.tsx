"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, LayoutGrid, List, Search, XCircle } from "lucide-react";
import MenuItemForm, { MenuItemFormRef } from "@/components/admin/MenuItemForm";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showSuccess, showError } from "@/utils/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: "appetizer" | "main" | "dessert" | "drink";
  type: "acehnese" | "french" | "other";
  image_url?: string | null;
  sort_order?: number | null;
}

const parsePriceToNumber = (priceString: string | null | undefined): number => {
  if (!priceString) return 0;
  const cleanedString = priceString.replace(/[^0-9]/g, '');
  return parseInt(cleanedString, 10) || 0;
};

const MenuItems = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const addFormRef = useRef<MenuItemFormRef>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (sessionStorage.getItem('menuViewMode') as 'grid' | 'list') || 'grid';
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<MenuItem['category'] | 'all'>("all");
  const [selectedType, setSelectedType] = useState<MenuItem['type'] | 'all'>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  useEffect(() => {
    sessionStorage.setItem('menuViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching menu items:", error);
      showError("Failed to load menu items.");
    } else {
      setMenuItems(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string, imageUrl: string | null) => {
    if (imageUrl) {
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage.from("assets").remove([`menu/${fileName}`]);
      }
    }

    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) {
      console.error("Error deleting menu item:", error);
      showError("Failed to delete menu item.");
    } else {
      showSuccess("Menu item deleted successfully.");
      fetchMenuItems();
    }
  };

  const handleAddFormSuccess = () => {
    if (addFormRef.current) {
      addFormRef.current.resetForm();
    }
    fetchMenuItems();
  };

  const handleEditFormSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingItem(null);
    fetchMenuItems();
  };

  const handleAddFormCancel = () => {
    if (addFormRef.current) {
      addFormRef.current.resetForm();
    }
  };

  const handleEditFormCancel = () => {
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedType("all");
    setMinPrice("");
    setMaxPrice("");
  };

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    const matchesType = selectedType === "all" || item.type === selectedType;

    const itemPrice = parsePriceToNumber(item.price);
    const min = minPrice ? parseInt(minPrice, 10) : 0;
    const max = maxPrice ? parseInt(maxPrice, 10) : Infinity;

    const matchesPrice = itemPrice >= min && itemPrice <= max;

    return matchesSearch && matchesCategory && matchesType && matchesPrice;
  });

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {filteredMenuItems.map((item) => (
        <Card key={item.id} className="border-border bg-admin-card-bg shadow-sm flex flex-col">
          <AspectRatio ratio={16 / 9} className="bg-muted">
            <img
              src={item.image_url || "/placeholder.svg"}
              alt={item.name}
              className="rounded-t-lg object-cover h-full w-full"
            />
          </AspectRatio>
          <CardHeader className="flex-grow p-3 pb-0">
            <CardTitle className="text-lg font-semibold text-foreground line-clamp-1">{item.name}</CardTitle>
            <p className="text-royal-gold text-sm mt-1">{item.price}</p>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-muted-foreground text-xs mt-2 line-clamp-2">{item.description}</p>
            <div className="mt-2 flex justify-between items-center">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.type === 'acehnese' ? 'bg-acehnese-green text-white' : item.type === 'french' ? 'bg-pastel-blue text-royal-red' : 'bg-muted text-foreground'}`}>
                {item.type === 'acehnese' ? 'Acehnese' : item.type === 'french' ? 'French' : 'Other'}
              </span>
              <span className="text-muted-foreground text-xs capitalize">{item.category}</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 p-3 pt-0">
            <Button variant="secondary" size="icon" onClick={() => handleEdit(item)} className="bg-pastel-blue text-royal-red hover:bg-royal-gold hover:text-white">
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" className="bg-brand-red hover:bg-brand-red/90">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-brand-red">Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This action cannot be undone. This will permanently delete the menu item "{item.name}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(item.id, item.image_url || null)} className="bg-brand-red text-brand-red-foreground hover:bg-brand-red/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
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
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Price</TableHead>
              <TableHead className="hidden md:table-cell text-muted-foreground">Description</TableHead>
              <TableHead className="hidden sm:table-cell text-muted-foreground">Category</TableHead>
              <TableHead className="hidden sm:table-cell text-muted-foreground">Type</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMenuItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <img src={item.image_url || '/placeholder.svg'} alt={item.name} className="h-12 w-12 object-cover rounded-md border border-border" />
                </TableCell>
                <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                <TableCell className="text-royal-gold">{item.price}</TableCell>
                <TableCell className="hidden md:table-cell max-w-xs text-muted-foreground">
                  <p className="truncate">{item.description}</p>
                </TableCell>
                <TableCell className="hidden sm:table-cell capitalize text-foreground">{item.category}</TableCell>
                <TableCell className="hidden sm:table-cell capitalize text-foreground">{item.type}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="text-foreground hover:bg-muted">
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
                            This action cannot be undone. This will permanently delete the menu item "{item.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item.id, item.image_url || null)} className="bg-brand-red text-brand-red-foreground hover:bg-brand-red/90">
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

  return (
    <div className="space-y-8">
      {/* Add New Item Form - Always visible */}
      <div className="mb-8">
        <MenuItemForm ref={addFormRef} item={null} onSuccess={handleAddFormSuccess} onCancel={handleAddFormCancel} />
      </div>

      {/* Existing Menu Items Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">Existing Menu Items</h2>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? "bg-brand-red text-brand-red-foreground hover:bg-brand-red/90" : "border-border text-foreground hover:bg-muted"}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')} className={viewMode === 'list' ? "bg-brand-red text-brand-red-foreground hover:bg-brand-red/90" : "border-border text-foreground hover:bg-muted"}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="mb-6 border-border bg-admin-card-bg shadow-sm p-4">
          <CardContent className="p-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-border focus:border-brand-red focus:ring-brand-red"
                />
              </div>
              <Select onValueChange={(value: MenuItem['category'] | 'all') => setSelectedCategory(value)} value={selectedCategory}>
                <SelectTrigger className="border-border focus:border-brand-red focus:ring-brand-red">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="appetizer">Appetizer</SelectItem>
                  <SelectItem value="main">Main Course</SelectItem>
                  <SelectItem value="dessert">Dessert</SelectItem>
                  <SelectItem value="drink">Drink</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={(value: MenuItem['type'] | 'all') => setSelectedType(value)} value={selectedType}>
                <SelectTrigger className="border-border focus:border-brand-red focus:ring-brand-red">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="acehnese">Acehnese</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min Price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="border-border focus:border-brand-red focus:ring-brand-red"
                />
                <Input
                  type="number"
                  placeholder="Max Price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="border-border focus:border-brand-red focus:ring-brand-red"
                />
              </div>
            </div>
            {(searchTerm || selectedCategory !== "all" || selectedType !== "all" || minPrice || maxPrice) && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleClearFilters} className="border-border text-foreground hover:bg-muted">
                  <XCircle className="h-4 w-4 mr-2" /> Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="border-border bg-admin-card-bg shadow-sm">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="w-full h-[150px] mb-4" />
                  <Skeleton className="h-5 w-1/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-1" />
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredMenuItems.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg border-border text-muted-foreground">
            <p className="mb-4">No menu items found matching your filters.</p>
            <Button onClick={handleClearFilters} variant="outline" className="border-border text-foreground hover:bg-muted">
              <XCircle className="h-4 w-4 mr-2" /> Clear Filters
            </Button>
          </div>
        ) : (
          viewMode === 'grid' ? renderGridView() : renderListView()
        )}
      </div>

      {/* Edit Item Dialog */}
      {editingItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[90vw] max-w-md bg-card border-border shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-brand-red text-lg font-semibold">Edit Menu Item</DialogTitle>
            </DialogHeader>
            <MenuItemForm item={editingItem} onSuccess={handleEditFormSuccess} onCancel={handleEditFormCancel} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MenuItems;