"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react"; // Import useRef
import {
  PlusCircle,
  Edit,
  Trash2,
  Search,
  Image as ImageIcon,
} from "lucide-react"; // Added ImageIcon
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetcher } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

// --- Updated Brand Interface ---
interface Brand {
  id: number;
  name: string;
  image: string | null; // Added image property
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function BrandsManagement() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandImage, setNewBrandImage] = useState<File | null>(null); // State for new brand image file
  const [loading, setLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [currentBrandImageFile, setCurrentBrandImageFile] =
    useState<File | null>(null); // State for image file during edit
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Refs for file inputs to clear them programmatically if needed
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const fetchBrands = async (search = "") => {
    setLoading(true);
    try {
      const data = await fetcher<PaginatedResponse<Brand>>(
        `/brands?search=${search}`
      );
      setBrands(data.results);
      toast({
        title: "Success",
        description: "Brands loaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load brands: ${
          error.message || error.toString()
        }`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newBrandName) {
      toast({
        title: "Error",
        description: "Brand name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("name", newBrandName);
    if (newBrandImage) {
      formData.append("image", newBrandImage);
    }

    try {
      const createdBrand = await fetcher<Brand>(
        "/brands/",
        "POST",
        formData,
        true // isMultipart: true for FormData
      );

      setBrands((prevBrands) => [...prevBrands, createdBrand]);
      setNewBrandName("");
      setNewBrandImage(null); // Clear the file input state
      if (createFileInputRef.current) {
        createFileInputRef.current.value = ""; // Clear the actual file input element
      }

      toast({
        title: "Success",
        description: `Brand "${createdBrand.name}" created successfully.`,
      });
      fetchBrands(searchQuery); // Refresh for consistency and pagination
    } catch (error: any) {
      console.error("Failed to create brand:", error);
      const errorMessage =
        error.response?.data?.name?.[0] || error.message || error.toString();
      toast({
        title: "Error",
        description: `Failed to create brand: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBrand) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("name", currentBrand.name);
    if (currentBrandImageFile) {
      formData.append("image", currentBrandImageFile);
    } else if (
      currentBrand.image === null &&
      editFileInputRef.current?.files?.length === 0
    ) {
      // If the user cleared the image, send an empty string or null to delete it on the backend
      // This depends on your backend's API for image deletion/replacement.
      // A common pattern is to send an empty string or specific flag.
      // For Django-rest-framework, sending a field with an empty string for FileField can clear it.
      formData.append("image", ""); // Or a specific flag if your backend requires it to delete the image
    }

    try {
      const updatedBrand = await fetcher<Brand>(
        `/brands/${currentBrand.id}/`,
        "PATCH", // Use PATCH for partial updates
        formData,
        true // isMultipart: true for FormData
      );

      setBrands((prevBrands) =>
        prevBrands.map((brand) =>
          brand.id === updatedBrand.id ? updatedBrand : brand
        )
      );
      setIsEditDialogOpen(false);
      setCurrentBrand(null);
      setCurrentBrandImageFile(null); // Clear image file state
      if (editFileInputRef.current) {
        editFileInputRef.current.value = ""; // Clear the actual file input element
      }
      toast({
        title: "Success",
        description: `Brand "${updatedBrand.name}" updated successfully.`,
      });
      fetchBrands(searchQuery); // Re-fetch to ensure the new image URL is loaded
    } catch (error: any) {
      console.error("Failed to update brand:", error);
      const errorMessage =
        error.response?.data?.name?.[0] || error.message || error.toString();
      toast({
        title: "Error",
        description: `Failed to update brand: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!currentBrand) return;

    setLoading(true);
    try {
      await fetcher(`/brands/${currentBrand.id}/`, "DELETE");
      setBrands((prevBrands) =>
        prevBrands.filter((brand) => brand.id !== currentBrand.id)
      );
      setIsConfirmDialogOpen(false);
      setCurrentBrand(null);
      toast({
        title: "Success",
        description: `Brand "${currentBrand.name}" deleted successfully.`,
      });
    } catch (error: any) {
      console.error("Delete brand error:", error);
      toast({
        title: "Error",
        description: `Failed to delete brand: ${
          error.message || error.toString()
        }.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands(searchQuery);
  }, [searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Brand</CardTitle>
          <CardDescription>
            Add a new car brand with an optional image.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreateBrand}
            className="grid gap-4" // Removed md:grid-cols-2 to allow natural flow for image input
          >
            <div className="grid gap-2">
              <Label htmlFor="new-brand-name">Brand Name</Label>
              <Input
                id="new-brand-name"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Enter brand name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-brand-image">Brand Image (Optional)</Label>
              <Input
                id="new-brand-image"
                type="file"
                accept="image/*"
                ref={createFileInputRef}
                onChange={(e) =>
                  setNewBrandImage(e.target.files ? e.target.files[0] : null)
                }
              />
              {newBrandImage && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {newBrandImage.name}
                </p>
              )}
            </div>
            <Button type="submit" disabled={loading}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {loading ? "Creating..." : "Create Brand"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Brands</CardTitle>
          <CardDescription>View and manage car brands.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search brands by name..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9"
            />
          </div>
          {loading && brands.length === 0 ? (
            <div className="text-center py-4">Loading brands...</div>
          ) : brands.length === 0 && !loading ? (
            <div className="text-center py-4 text-muted-foreground">
              No brands found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Image</TableHead> {/* Added Image column */}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>{brand.id}</TableCell>
                    <TableCell>{brand.name}</TableCell>
                    <TableCell>
                      {brand.image ? (
                        <img
                          src={brand.image}
                          alt={brand.name}
                          className="h-10 w-10 object-contain rounded-md"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentBrand(brand);
                          setCurrentBrandImageFile(null); // Reset file input when opening edit dialog
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentBrand(brand);
                          setIsConfirmDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Brand Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <CardDescription>Make changes to the brand here.</CardDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBrand} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-brand-name">Brand Name</Label>
              <Input
                id="edit-brand-name"
                value={currentBrand?.name || ""}
                onChange={(e) =>
                  setCurrentBrand((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-brand-image">Brand Image (Optional)</Label>
              {currentBrand?.image && !currentBrandImageFile && (
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={currentBrand.image}
                    alt="Current Brand Image"
                    className="h-16 w-16 object-contain rounded-md border"
                  />
                  <span className="text-sm text-muted-foreground">
                    Current image
                  </span>
                </div>
              )}
              <Input
                id="edit-brand-image"
                type="file"
                accept="image/*"
                ref={editFileInputRef}
                onChange={(e) =>
                  setCurrentBrandImageFile(
                    e.target.files ? e.target.files[0] : null
                  )
                }
              />
              {currentBrandImageFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  New image selected: {currentBrandImageFile.name}
                </p>
              )}
              {!currentBrand?.image && !currentBrandImageFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  No image currently. Select a new one.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleDeleteBrand}
        title="Are you absolutely sure?"
        description={`This action cannot be undone. This will permanently delete the brand "${currentBrand?.name}".`}
      />
    </div>
  );
}
