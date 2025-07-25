"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  PlusCircle,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

// Define an interface for CarModel if you fetch them to provide a dropdown
interface CarModel {
  id: number;
  name: string;
}

interface Category {
  id: number;
  car_model: number; // Cannot be null as per API error
  name: string;
  image: string; // This will be the URL after upload
}

interface CategoriesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Category[];
}

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]); // To store available car models

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryCarModel, setNewCategoryCarModel] = useState<
    number | string
  >("");
  const [newCategoryImageFile, setNewCategoryImageFile] = useState<File | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  const [editCategoryImageFile, setEditCategoryImageFile] =
    useState<File | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  // Fetch Car Models when component mounts
  useEffect(() => {
    const fetchCarModels = async () => {
      try {
        const response = await fetcher<{ results: CarModel[] }>("/car-models/"); // Ensure this endpoint is correct
        if (Array.isArray(response?.results)) {
          setCarModels(response.results);
        } else {
          // Log specific response for debugging if not array
          console.error(
            "API response for car-models was not an array:",
            response
          );
          throw new Error(
            "Invalid response: car models results is not an array"
          );
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Failed to load car models: ${error.message}`,
          variant: "destructive",
        });
      }
    };
    fetchCarModels();
  }, []);

  const fetchCategories = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const url = `/categories?page=${page}&search=${search}`;
      // For GET requests, isMultipart is false by default in fetcher, no need to specify.
      const data = await fetcher<CategoriesResponse>(url);
      setCategories(data.results);
      setTotalPages(Math.ceil(data.count / 10));
      toast({
        title: "Success",
        description: "Categories loaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load categories: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation for name
    if (!newCategoryName.trim()) {
      toast({
        title: "Xatolik",
        description: "Kategoriya nomi bo'sh bo'lishi mumkin emas.",
        variant: "destructive",
      });
      return;
    }
    // Frontend validation for car_model (ensure it's a selected number, not the placeholder string)
    if (newCategoryCarModel === "" || isNaN(Number(newCategoryCarModel))) {
      toast({
        title: "Xatolik",
        description: "Avtomobil modeli tanlanishi shart.",
        variant: "destructive",
      });
      return;
    }

    // Frontend validation for image (if it's required for creation)
    if (!newCategoryImageFile) {
      toast({
        title: "Xatolik",
        description: "Rasm yuklanishi shart.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", newCategoryName.trim()); // Trim whitespace
      formData.append("car_model", String(newCategoryCarModel)); // Ensure it's string for FormData

      if (newCategoryImageFile) {
        formData.append("image", newCategoryImageFile);
      }
      // No 'else' needed here for image, as we validated it above.

      const createdCategory = await fetcher<Category>(
        "/categories/",
        "POST",
        formData,
        true // <<<<<<<<<<<<<< IMPORTANT: Set isMultipart to true for FormData
      );

      setCategories((prev) => [...prev, createdCategory]);
      setNewCategoryName("");
      setNewCategoryCarModel(""); // Reset to empty string for the placeholder
      setNewCategoryImageFile(null);
      const fileInput = document.getElementById(
        "new-category-image"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      toast({
        title: "Muvaffaqiyatli",
        description: `Kategoriya "${createdCategory.name}" muvaffaqiyatli yaratildi.`,
      });

      fetchCategories(currentPage, searchQuery);
    } catch (error: any) {
      console.error("Failed to create category:", error);
      let errorMessage =
        "Kategoriya yaratishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.";
      if (error.response && error.response.data) {
        if (typeof error.response.data === "object") {
          errorMessage = Object.entries(error.response.data)
            .map(
              ([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
            )
            .join("; ");
        } else {
          errorMessage = String(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Xatolik",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory) return;

    // Frontend validation for name
    if (!currentCategory.name.trim()) {
      toast({
        title: "Xatolik",
        description: "Kategoriya nomi bo'sh bo'lishi mumkin emas.",
        variant: "destructive",
      });
      return;
    }
    // Frontend validation for car_model
    if (
      !currentCategory.car_model ||
      isNaN(Number(currentCategory.car_model))
    ) {
      toast({
        title: "Xatolik",
        description: "Avtomobil modeli tanlanishi shart.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      // Always append fields that might be updated, even if they aren't changing their value,
      // as PATCH often means "send what you want to change".
      // But if the backend requires ALL fields for PATCH (less common but possible),
      // ensure all currentCategory fields are appended.
      formData.append("name", currentCategory.name.trim());
      formData.append("car_model", String(currentCategory.car_model));

      if (editCategoryImageFile) {
        formData.append("image", editCategoryImageFile);
      }
      // If `editCategoryImageFile` is null, the `image` field will not be added to FormData.
      // For PATCH requests, this is usually desired: only send fields that are being updated.
      // The backend will keep the existing image if no new image is provided.

      const updatedCategory = await fetcher<Category>(
        `/categories/${currentCategory.id}/`,
        "PATCH",
        formData,
        true // <<<<<<<<<<<<<< IMPORTANT: Set isMultipart to true for FormData
      );

      setCategories(
        categories.map((cat) =>
          cat.id === updatedCategory.id ? updatedCategory : cat
        )
      );
      setIsEditDialogOpen(false);
      setCurrentCategory(null);
      setEditCategoryImageFile(null);
      const editFileInput = document.getElementById(
        "edit-category-image"
      ) as HTMLInputElement;
      if (editFileInput) editFileInput.value = "";

      toast({
        title: "Muvaffaqiyatli",
        description: `Kategoriya "${updatedCategory.name}" muvaffaqiyatli yangilandi.`,
      });
    } catch (error: any) {
      console.error("Failed to update category:", error);
      let errorMessage =
        "Kategoriyani yangilashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.";
      if (error.response && error.response.data) {
        if (typeof error.response.data === "object") {
          errorMessage = Object.entries(error.response.data)
            .map(
              ([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
            )
            .join("; ");
        } else {
          errorMessage = String(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Xatolik",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!currentCategory) return;

    setLoading(true);
    try {
      // For DELETE requests, isMultipart is false by default in fetcher, no need to specify.
      await fetcher(`/categories/${currentCategory.id}/`, "DELETE");
      setCategories(categories.filter((cat) => cat.id !== currentCategory.id));
      setIsConfirmDialogOpen(false);
      setCurrentCategory(null);
      toast({
        title: "Muvaffaqiyatli",
        description: `Kategoriya "${currentCategory.name}" muvaffaqiyatli o'chirildi.`,
      });
      if (categories.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchCategories(currentPage, searchQuery);
      }
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      let errorMessage =
        "Kategoriyani o'chirishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.";
      if (error.response && error.response.data) {
        if (typeof error.response.data === "object") {
          errorMessage = Object.entries(error.response.data)
            .map(
              ([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
            )
            .join("; ");
        } else {
          errorMessage = String(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Xatolik",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Yangi Kategoriya Yaratish</CardTitle>
          <CardDescription>
            Do'koningizga yangi mahsulot kategoriyasini qo'shing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreateCategory}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="grid gap-2">
              <Label htmlFor="new-category-name">Kategoriya Nomi</Label>
              <Input
                id="new-category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Kategoriya nomini kiriting"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-category-car-model">Avtomobil Modeli</Label>
              <select
                id="new-category-car-model"
                value={newCategoryCarModel}
                onChange={(e) => setNewCategoryCarModel(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Modelni tanlang</option>{" "}
                {/* Placeholder option */}
                {carModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-category-image">Rasm</Label>
              <Input
                type="file"
                id="new-category-image"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setNewCategoryImageFile(file);
                  } else {
                    setNewCategoryImageFile(null); // Clear file if nothing selected
                  }
                }}
                required // Added required for image as per your validation logic.
              />
            </div>
            <Button type="submit" className="md:col-span-2" disabled={loading}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {loading ? "Yaratilmoqda..." : "Kategoriya Yaratish"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mavjud Kategoriyalar</CardTitle>
          <CardDescription>
            Mavjud mahsulot kategoriyalarini ko'rish va boshqarish.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kategoriyalarni nom bo'yicha qidirish..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9"
            />
          </div>
          {loading && categories.length === 0 ? (
            <div className="text-center py-4">Kategoriyalar yuklanmoqda...</div>
          ) : categories.length === 0 && !loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Kategoriyalar topilmadi.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Rasm</TableHead>
                    <TableHead>Avtomobil Modeli ID</TableHead>
                    <TableHead className="text-right">Harakatlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.id}</TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>
                        {category.image && (
                          <Image
                            src={category.image}
                            alt={category.name}
                            width={48}
                            height={48}
                            className="rounded-md object-cover"
                          />
                        )}
                      </TableCell>
                      <TableCell>{category.car_model || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCurrentCategory(category);
                            setEditCategoryImageFile(null); // Clear file state for new edit session
                            const editFileInput = document.getElementById(
                              "edit-category-image"
                            ) as HTMLInputElement;
                            if (editFileInput) editFileInput.value = "";
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Tahrirlash</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCurrentCategory(category);
                            setIsConfirmDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">O'chirish</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Oldingi sahifa</span>
                </Button>
                <span className="text-sm text-muted-foreground">
                  Sahifa {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Keyingi sahifa</span>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Kategoriyani Tahrirlash Dialogi */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Kategoriyani Tahrirlash</DialogTitle>
            <CardDescription>
              Kategoriya ma'lumotlarini bu yerda o'zgartiring.
            </CardDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCategory} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-category-name">Kategoriya Nomi</Label>
              <Input
                id="edit-category-name"
                value={currentCategory?.name || ""}
                onChange={(e) =>
                  setCurrentCategory((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category-car-model">Avtomobil Modeli</Label>
              <select
                id="edit-category-car-model"
                value={currentCategory?.car_model || ""}
                onChange={(e) =>
                  setCurrentCategory((prev) =>
                    prev ? { ...prev, car_model: Number(e.target.value) } : null
                  )
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Modelni tanlang</option>
                {carModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category-image">Rasm</Label>
              {currentCategory?.image && !editCategoryImageFile ? (
                <div className="mb-2">
                  <Image
                    src={currentCategory.image}
                    alt="Hozirgi rasm"
                    width={96}
                    height={96}
                    className="rounded-md object-cover"
                  />
                  <span className="text-xs text-muted-foreground mt-1">
                    Hozirgi rasm
                  </span>
                </div>
              ) : editCategoryImageFile ? (
                <div className="mb-2">
                  <Image
                    src={URL.createObjectURL(editCategoryImageFile)}
                    alt="Tanlangan rasm"
                    width={96}
                    height={96}
                    className="rounded-md object-cover"
                  />
                  <span className="text-xs text-muted-foreground mt-1">
                    Tanlangan rasm
                  </span>
                </div>
              ) : null}
              <Input
                type="file"
                id="edit-category-image"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setEditCategoryImageFile(file);
                  } else {
                    setEditCategoryImageFile(null); // Clear file if nothing selected
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Saqlanmoqda..." : "O'zgarishlarni Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* O'chirishni Tasdiqlash Dialogi */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleDeleteCategory}
        title="Haqiqatan ham ishonchingiz komilmi?"
        description={`Bu harakatni bekor qilib bo'lmaydi. Bu "${currentCategory?.name}" kategoriyasini butunlay o'chirib tashlaydi.`}
      />
    </div>
  );
}
