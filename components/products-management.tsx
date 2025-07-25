"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2, Search } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

interface Product {
  id: number;
  brand: number; // Changed from category
  car_model: number;
  uploaded_images: string[]; // Assuming URLs for simplicity
  name: string;
  price_usd: string;
  description: string;
  youtube_link: string;
  brand_name?: string; // Changed from category_name
  car_model_name?: string;
  images: { id: number; image: string; product: number }[]; // Added for consistency with API response
}

interface Brand {
  id: number;
  name: string;
}

interface CarModel {
  id: number;
  name: string;
}

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]); // Changed from categories
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [newProduct, setNewProduct] = useState({
    brand: 0, // Changed from category
    car_model: 0,
    uploaded_images: null as FileList | null, // Changed to FileList for multiple files
    name: "",
    price_usd: "",
    description: "",
    youtube_link: "",
  });
  const [loading, setLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchDependencies = async () => {
    try {
      const brandsData = await fetcher<{ results: Brand[] }>("/brands/"); // Fetch brands
      setBrands(brandsData.results);
      const carModelsData = await fetcher<{ results: CarModel[] }>(
        "/car-models/"
      );
      setCarModels(carModelsData.results);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load dependencies: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async (search = "") => {
    setLoading(true);
    try {
      const data = await fetcher<{ results: Product[] }>(
        `/products?search=${search}`
      );
      const enrichedData = data?.results?.map((product) => ({
        ...product,
        brand_name:
          brands.find((b) => b.id === product.brand)?.name || "Unknown Brand", // Changed to brand_name
        car_model_name:
          carModels.find((cm) => cm.id === product.car_model)?.name ||
          "Unknown Model",
      }));
      setProducts(enrichedData);
      toast({
        title: "Success",
        description: "Products loaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load products: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newProduct.name ||
      !newProduct.price_usd ||
      !newProduct.brand || // Changed from category
      !newProduct.car_model
    ) {
      toast({
        title: "Error",
        description: "Name, Price, Brand, and Car Model are required.", // Updated message
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("price_usd", newProduct.price_usd.toString());
      formData.append("brand", newProduct.brand.toString()); // Changed from category
      formData.append("car_model", newProduct.car_model.toString());
      if (newProduct.description) {
        formData.append("description", newProduct.description);
      }
      if (newProduct.youtube_link) {
        formData.append("youtube_link", newProduct.youtube_link);
      }

      if (newProduct.uploaded_images && newProduct.uploaded_images.length > 0) {
        Array.from(newProduct.uploaded_images).forEach((file: File) => {
          formData.append("uploaded_images", file);
        });
      }

      const createdProduct = await fetcher<Product>(
        "/products/",
        "POST",
        formData,
        true // isMultipart
      );

      setProducts([
        ...products,
        {
          ...createdProduct,
          brand_name:
            brands.find((b) => b.id === createdProduct.brand)?.name ||
            "Unknown Brand", // Changed to brand_name
          car_model_name:
            carModels.find((cm) => cm.id === createdProduct.car_model)?.name ||
            "Unknown Model",
        },
      ]);

      // Reset form
      setNewProduct({
        brand: 0, // Changed from category
        car_model: 0,
        uploaded_images: null,
        name: "",
        price_usd: "",
        description: "",
        youtube_link: "",
      });

      toast({
        title: "Success",
        description: `Product "${createdProduct.name}" created successfully.`,
      });

      fetchProducts(searchQuery); // Refresh list
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create product: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    setLoading(true);
    try {
      // Create a new FormData object for the PATCH request
      const formData = new FormData();

      // Append fields that might have changed
      formData.append("name", currentProduct.name);
      formData.append("price_usd", currentProduct.price_usd.toString());
      formData.append("brand", currentProduct.brand.toString()); // Changed from category
      formData.append("car_model", currentProduct.car_model.toString());
      if (currentProduct.description) {
        formData.append("description", currentProduct.description);
      }
      if (currentProduct.youtube_link) {
        formData.append("youtube_link", currentProduct.youtube_link);
      }

      // If images were selected for update, append them
      // Note: This part needs careful handling. If you're sending FileList,
      // it should be handled in `newProduct.uploaded_images` type.
      // For simplicity, I'm assuming existing `uploaded_images` on `currentProduct`
      // are URLs and not files. If file upload is for update, the logic
      // for handling `currentProduct.uploaded_images` would need to change to FileList as well.
      // For now, I'm assuming `uploaded_images` on `currentProduct` is an array of strings (URLs).
      // If the user selects new files for update, you'd need a separate state for it.
      // For this example, I'm sticking to the "comma-separated URLs" for existing images in the input field,
      // which means `uploaded_images` on the Product interface is `string[]`.
      // If `uploaded_images` for update is intended to be *new files*, then the current
      // implementation won't directly support that via `PATCH` with JSON, it needs multipart.
      // Given the `uploaded_images: string[]` on `Product` interface,
      // the existing `uploaded_images` are likely URLs for *display*, not files to be re-uploaded.

      const updatedProduct = await fetcher<Product>(
        `/products/${currentProduct.id}/`,
        "PATCH",
        {
          // Sending only changed fields if using JSON PATCH, otherwise send all for PUT
          name: currentProduct.name,
          price_usd: currentProduct.price_usd,
          brand: currentProduct.brand, // Changed from category
          car_model: currentProduct.car_model,
          description: currentProduct.description,
          youtube_link: currentProduct.youtube_link,
          // uploaded_images: currentProduct.uploaded_images, // Only send if updating URLs directly, not files
        }
      );
      setProducts(
        products.map((prod) =>
          prod.id === updatedProduct.id
            ? {
                ...updatedProduct,
                brand_name:
                  brands.find((b) => b.id === updatedProduct.brand)?.name ||
                  "Unknown Brand", // Changed to brand_name
                car_model_name:
                  carModels.find((cm) => cm.id === updatedProduct.car_model)
                    ?.name || "Unknown Model",
              }
            : prod
        )
      );
      setIsEditDialogOpen(false);
      setCurrentProduct(null);
      toast({
        title: "Success",
        description: `Product "${updatedProduct.name}" updated successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update product: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!currentProduct) return;

    setLoading(true);
    try {
      await fetcher(`/products/${currentProduct.id}/`, "DELETE");
      setProducts(products.filter((prod) => prod.id !== currentProduct.id));
      setIsConfirmDialogOpen(false);
      setCurrentProduct(null);
      toast({
        title: "Success",
        description: `Product "${currentProduct.name}" deleted successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (brands.length > 0 && carModels.length > 0) {
      // Changed from categories.length and carModels?.results?.length
      fetchProducts(searchQuery);
    }
  }, [brands, carModels, searchQuery]); // Dependencies updated

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Product</CardTitle>
          <CardDescription>
            Add a new product to your inventory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreateProduct}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <div className="grid gap-2">
              <Label htmlFor="new-product-name">Product Name</Label>
              <Input
                id="new-product-name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                placeholder="Enter product name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-product-price">Price (USD)</Label>
              <Input
                id="new-product-price"
                value={newProduct.price_usd}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price_usd: e.target.value })
                }
                placeholder="e.g., 19.99"
                type="number"
                step="0.01"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-product-brand">Brand</Label>{" "}
              {/* Changed from category */}
              <Select
                onValueChange={(value) =>
                  setNewProduct({ ...newProduct, brand: Number(value) })
                } // Changed to brand
                value={newProduct.brand.toString()} // Changed to brand
                required
              >
                <SelectTrigger id="new-product-brand">
                  {" "}
                  {/* Changed from category */}
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    // Changed from categories
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-product-car-model">Car Model</Label>
              <Select
                onValueChange={(value) =>
                  setNewProduct({ ...newProduct, car_model: Number(value) })
                }
                value={newProduct.car_model.toString()}
                required
              >
                <SelectTrigger id="new-product-car-model">
                  <SelectValue placeholder="Select a car model" />
                </SelectTrigger>
                <SelectContent>
                  {carModels.map((model) => (
                    <SelectItem key={model.id} value={model.id.toString()}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 col-span-full">
              <Label htmlFor="new-product-images">Upload Images</Label>{" "}
              {/* Changed label */}
              <Input
                id="new-product-images"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) {
                    setNewProduct((prev) => ({
                      ...prev,
                      uploaded_images: files,
                    }));
                  }
                }}
              />
            </div>
            <div className="grid gap-2 col-span-full">
              <Label htmlFor="new-product-description">Description</Label>
              <Textarea
                id="new-product-description"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
                placeholder="Enter product description"
              />
            </div>
            <div className="grid gap-2 col-span-full">
              <Label htmlFor="new-product-youtube-link">YouTube Link</Label>
              <Input
                id="new-product-youtube-link"
                value={newProduct.youtube_link}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, youtube_link: e.target.value })
                }
                placeholder="Enter YouTube video link"
                type="url"
              />
            </div>
            <Button
              type="submit"
              className="md:col-span-2 lg:col-span-3"
              disabled={loading}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {loading ? "Creating..." : "Create Product"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Products</CardTitle>
          <CardDescription>View and manage your products.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9"
            />
          </div>
          {loading && products.length === 0 ? (
            <div className="text-center py-4">Loading products...</div>
          ) : products.length === 0 && !loading ? (
            <div className="text-center py-4 text-muted-foreground">
              No products found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price (USD)</TableHead>
                  <TableHead>Brand</TableHead> {/* Changed from Category */}
                  <TableHead>Car Model</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.id}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>${product.price_usd}</TableCell>
                    <TableCell>{product.brand_name}</TableCell>{" "}
                    {/* Changed from category_name */}
                    <TableCell>{product.car_model_name}</TableCell>
                    <TableCell>
                      <div className="flex -space-x-2 overflow-hidden">
                        {product.images?.slice(0, 3).map((imgObj, index) => (
                          <Image
                            key={index}
                            src={imgObj.image || "/placeholder.svg"}
                            alt={`Product image ${index + 1}`}
                            width={32}
                            height={32}
                            className="inline-block h-8 w-8 rounded-full ring-2 ring-background object-cover"
                          />
                        ))}
                        {product.images?.length > 3 && (
                          <span className="inline-block h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground ring-2 ring-background">
                            +{product.images.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentProduct({
                            ...product,
                            // Ensure `uploaded_images` is an array of strings for the input field
                            uploaded_images: product.uploaded_images || [],
                          });
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
                          setCurrentProduct(product);
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

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <CardDescription>Make changes to the product here.</CardDescription>
          </DialogHeader>
          <form
            onSubmit={handleUpdateProduct}
            className="grid gap-4 py-4 md:grid-cols-2"
          >
            <div className="grid gap-2">
              <Label htmlFor="edit-product-name">Product Name</Label>
              <Input
                id="edit-product-name"
                value={currentProduct?.name || ""}
                onChange={(e) =>
                  setCurrentProduct((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-product-price">Price (USD)</Label>
              <Input
                id="edit-product-price"
                value={currentProduct?.price_usd || ""}
                onChange={(e) =>
                  setCurrentProduct((prev) =>
                    prev ? { ...prev, price_usd: e.target.value } : null
                  )
                }
                type="number"
                step="0.01"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-product-brand">Brand</Label>{" "}
              {/* Changed from category */}
              <Select
                onValueChange={(value) =>
                  setCurrentProduct((prev) =>
                    prev ? { ...prev, brand: Number(value) } : null
                  )
                } // Changed to brand
                value={currentProduct?.brand.toString() || ""} // Changed to brand
                required
              >
                <SelectTrigger id="edit-product-brand">
                  {" "}
                  {/* Changed from category */}
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    // Changed from categories
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-product-car-model">Car Model</Label>
              <Select
                onValueChange={(value) =>
                  setCurrentProduct((prev) =>
                    prev ? { ...prev, car_model: Number(value) } : null
                  )
                }
                value={currentProduct?.car_model.toString() || ""}
                required
              >
                <SelectTrigger id="edit-product-car-model">
                  <SelectValue placeholder="Select a car model" />
                </SelectTrigger>
                <SelectContent>
                  {carModels.map((model) => (
                    <SelectItem key={model.id} value={model.id.toString()}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 col-span-full">
              <Label htmlFor="edit-product-description">Description</Label>
              <Textarea
                id="edit-product-description"
                value={currentProduct?.description || ""}
                onChange={(e) =>
                  setCurrentProduct((prev) =>
                    prev ? { ...prev, description: e.target.value } : null
                  )
                }
              />
            </div>
            <div className="grid gap-2 col-span-full">
              <Label htmlFor="edit-product-youtube-link">YouTube Link</Label>
              <Input
                id="edit-product-youtube-link"
                value={currentProduct?.youtube_link || ""}
                onChange={(e) =>
                  setCurrentProduct((prev) =>
                    prev ? { ...prev, youtube_link: e.target.value } : null
                  )
                }
                type="url"
              />
            </div>
            <DialogFooter className="col-span-full">
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
        onConfirm={handleDeleteProduct}
        title="Are you absolutely sure?"
        description={`This action cannot be undone. This will permanently delete the product "${currentProduct?.name}".`}
      />
    </div>
  );
}
