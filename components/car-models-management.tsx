"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react"; // useRef qo'shildi
import {
  PlusCircle,
  Edit,
  Trash2,
  Search,
  Image as ImageIcon,
} from "lucide-react"; // ImageIcon qo'shildi
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Interfaces ---
interface CarModel {
  id: number;
  name: string;
  brand: number; // ID of the brand
  brand_name?: string; // For display purposes, enriched on client-side
  image: string | null; // <-- Rasm maydoni qo'shildi
}

interface Brand {
  id: number;
  name: string;
}

// Define the type for a paginated API response
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function CarModelsManagement() {
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]); // Bu brendlarning tekis massivini saqlaydi
  const [newCarModelName, setNewCarModelName] = useState("");
  const [newCarModelBrand, setNewCarModelBrand] = useState<number | null>(null);
  const [newCarModelImage, setNewCarModelImage] = useState<File | null>(null); // Yangi model uchun rasm fayli
  const [loading, setLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [currentCarModel, setCurrentCarModel] = useState<CarModel | null>(null);
  const [currentCarModelImageFile, setCurrentCarModelImageFile] =
    useState<File | null>(null); // Tahrirlash uchun rasm fayli
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fayl inputlarini dasturlashtirish uchun refs
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // --- Ma'lumotlarni olish ---
  const fetchBrands = async () => {
    try {
      const data = await fetcher<PaginatedResponse<Brand>>("/brands/");
      setBrands(data.results);
    } catch (error: any) {
      console.error("Brendlar yuklanmadi:", error);
      toast({
        title: "Xato",
        description: `Brendlarni yuklashda xato: ${
          error.message || "Noma'lum xato"
        }`,
        variant: "destructive",
      });
    }
  };

  const fetchCarModels = async (search = "") => {
    setLoading(true);
    try {
      const data = await fetcher<PaginatedResponse<CarModel>>(
        `/car-models?search=${search}`
      );
      // Mashina modellarini brend nomlari bilan boyitish
      const enrichedData: CarModel[] = data.results.map((model) => ({
        ...model,
        brand_name:
          brands.find((b) => b.id === model.brand)?.name || "Noma'lum Brend",
      }));
      setCarModels(enrichedData);
      toast({
        title: "Muvaffaqiyatli",
        description: "Mashina modellari muvaffaqiyatli yuklandi.",
      });
    } catch (error: any) {
      console.error("Mashina modellari yuklanmadi:", error);
      toast({
        title: "Xato",
        description: `Mashina modellarini yuklashda xato: ${
          error.message || "Noma'lum xato"
        }`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Hendlerlar ---
  const handleCreateCarModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCarModelName || newCarModelBrand === null) {
      toast({
        title: "Xato",
        description: "Mashina modeli nomi va brendi majburiy.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("name", newCarModelName);
    formData.append("brand", newCarModelBrand.toString());
    if (newCarModelImage) {
      formData.append("image", newCarModelImage);
    }

    try {
      const createdCarModel = await fetcher<CarModel>(
        "/car-models/",
        "POST",
        formData,
        true // isMultipart: FormData uchun true
      );

      setCarModels((prevCarModels) => [
        ...prevCarModels,
        {
          ...createdCarModel,
          brand_name:
            brands.find((b) => b.id === createdCarModel.brand)?.name ||
            "Noma'lum Brend",
        },
      ]);
      setNewCarModelName("");
      setNewCarModelBrand(null);
      setNewCarModelImage(null); // Fayl input holatini tozalash
      if (createFileInputRef.current) {
        createFileInputRef.current.value = ""; // Haqiqiy fayl inputini tozalash
      }

      toast({
        title: "Muvaffaqiyatli",
        description: `Mashina modeli "${createdCarModel.name}" muvaffaqiyatli yaratildi.`,
      });
      fetchCarModels(searchQuery); // Konsistentlik va sahifalash uchun to'liq yangilash
    } catch (error: any) {
      console.error("Mashina modeli yaratilmadi:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.name?.[0] ||
        error.message ||
        "Noma'lum xato";
      toast({
        title: "Xato",
        description: `Mashina modelini yaratishda xato: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCarModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCarModel) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("name", currentCarModel.name);
    formData.append("brand", currentCarModel.brand.toString());

    if (currentCarModelImageFile) {
      formData.append("image", currentCarModelImageFile);
    } else if (
      currentCarModel.image &&
      editFileInputRef.current?.files?.length === 0
    ) {
      // Agar foydalanuvchi rasmni o'chirgan bo'lsa (yoki inputni tozalagan bo'lsa), bo'sh string yuboring
      // Backend ushbu maydonni tozalashni qanday tushunishiga bog'liq
      formData.append("image", "");
    }

    try {
      const updatedCarModel = await fetcher<CarModel>(
        `/car-models/${currentCarModel.id}/`,
        "PATCH", // Qisman yangilash uchun PATCH dan foydalaning
        formData,
        true // isMultipart: FormData uchun true
      );

      setCarModels((prevCarModels) =>
        prevCarModels.map((model) =>
          model.id === updatedCarModel.id
            ? {
                ...updatedCarModel,
                brand_name:
                  brands.find((b) => b.id === updatedCarModel.brand)?.name ||
                  "Noma'lum Brend",
              }
            : model
        )
      );
      setIsEditDialogOpen(false);
      setCurrentCarModel(null);
      setCurrentCarModelImageFile(null); // Fayl holatini tozalash
      if (editFileInputRef.current) {
        editFileInputRef.current.value = ""; // Haqiqiy fayl inputini tozalash
      }
      toast({
        title: "Muvaffaqiyatli",
        description: `Mashina modeli "${updatedCarModel.name}" muvaffaqiyatli yangilandi.`,
      });
      fetchCarModels(searchQuery); // Yangi rasm URL manzilini yuklash uchun qayta yuklash
    } catch (error: any) {
      console.error("Mashina modeli yangilanmadi:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.name?.[0] ||
        error.message ||
        "Noma'lum xato";
      toast({
        title: "Xato",
        description: `Mashina modelini yangilashda xato: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCarModel = async () => {
    if (!currentCarModel) return;

    setLoading(true);
    try {
      await fetcher(`/car-models/${currentCarModel.id}/`, "DELETE");
      setCarModels((prevCarModels) =>
        prevCarModels.filter((model) => model.id !== currentCarModel.id)
      );
      setIsConfirmDialogOpen(false);
      setCurrentCarModel(null);
      toast({
        title: "Muvaffaqiyatli",
        description: `Mashina modeli "${currentCarModel.name}" muvaffaqiyatli o'chirildi.`,
      });
    } catch (error: any) {
      console.error("Mashina modelini o'chirishda xato:", error);
      toast({
        title: "Xato",
        description: `Mashina modelini o'chirishda xato: ${
          error.message || "Noma'lum xato"
        }`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Effektlar ---
  useEffect(() => {
    fetchBrands(); // Brendlarni komponent yuklanganda bir marta yuklash
  }, []);

  useEffect(() => {
    // Brendlar yuklanganda yoki qidiruv so'rovi o'zgarganda mashina modellarini yuklash
    if (brands.length > 0) {
      fetchCarModels(searchQuery);
    }
  }, [brands, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="grid gap-6">
      {/* Yangi Mashina Modeli Yaratish Karti */}
      <Card>
        <CardHeader>
          <CardTitle>Yangi Mashina Modeli Yaratish</CardTitle>
          <CardDescription>
            Yangi mashina modelini qo'shing va uni brendga tayinlang.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreateCarModel}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="grid gap-2">
              <Label htmlFor="new-car-model-name">Model Nomi</Label>
              <Input
                id="new-car-model-name"
                value={newCarModelName}
                onChange={(e) => setNewCarModelName(e.target.value)}
                placeholder="Model nomini kiriting"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-car-model-brand">Brend</Label>
              <Select
                onValueChange={(value) => setNewCarModelBrand(Number(value))}
                value={newCarModelBrand?.toString() || ""}
                required
              >
                <SelectTrigger id="new-car-model-brand">
                  <SelectValue placeholder="Brend tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Rasm qo'shish inputi */}
            <div className="grid gap-2 md:col-span-2">
              {" "}
              {/* To'liq eni uchun */}
              <Label htmlFor="new-car-model-image">
                Model Rasmi (Ixtiyoriy)
              </Label>
              <Input
                id="new-car-model-image"
                type="file"
                accept="image/*"
                ref={createFileInputRef}
                onChange={(e) =>
                  setNewCarModelImage(e.target.files ? e.target.files[0] : null)
                }
              />
              {newCarModelImage && (
                <p className="text-sm text-muted-foreground mt-1">
                  Tanlangan: {newCarModelImage.name}
                </p>
              )}
            </div>

            <Button type="submit" className="md:col-span-2" disabled={loading}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {loading ? "Yaratilmoqda..." : "Mashina Modeli Yaratish"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Mavjud Mashina Modellari Karti */}
      <Card>
        <CardHeader>
          <CardTitle>Mavjud Mashina Modellari</CardTitle>
          <CardDescription>
            Mashina modellarini ko'rish va boshqarish.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Mashina modellarini nomi bo'yicha qidiring..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9"
            />
          </div>
          {loading && carModels.length === 0 ? (
            <div className="text-center py-4">
              Mashina modellari yuklanmoqda...
            </div>
          ) : carModels.length === 0 && !loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Mashina modellari topilmadi.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nomi</TableHead>
                  <TableHead>Brend</TableHead>
                  <TableHead>Rasm</TableHead> {/* Rasm ustuni qo'shildi */}
                  <TableHead className="text-right">Harakatlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carModels.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>{model.id}</TableCell>
                    <TableCell>{model.name}</TableCell>
                    <TableCell>{model.brand_name}</TableCell>
                    <TableCell>
                      {model.image ? (
                        <img
                          src={model.image}
                          alt={model.name}
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
                          setCurrentCarModel(model);
                          setCurrentCarModelImageFile(null); // Tahrirlash dialogini ochganda fayl inputini tozalash
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
                          setCurrentCarModel(model);
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
          )}
        </CardContent>
      </Card>

      {/* Mashina Modelini Tahrirlash Dialogi */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Mashina Modelini Tahrirlash</DialogTitle>
            <CardDescription>
              Mashina modeliga o'zgartirishlar kiriting.
            </CardDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCarModel} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-car-model-name">Model Nomi</Label>
              <Input
                id="edit-car-model-name"
                value={currentCarModel?.name || ""}
                onChange={(e) =>
                  setCurrentCarModel((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-car-model-brand">Brend</Label>
              <Select
                onValueChange={(value) =>
                  setCurrentCarModel((prev) =>
                    prev ? { ...prev, brand: Number(value) } : null
                  )
                }
                value={currentCarModel?.brand?.toString() || ""}
                required
              >
                <SelectTrigger id="edit-car-model-brand">
                  <SelectValue placeholder="Brend tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Rasm tahrirlash inputi */}
            <div className="grid gap-2">
              <Label htmlFor="edit-car-model-image">
                Model Rasmi (Ixtiyoriy)
              </Label>
              {currentCarModel?.image && !currentCarModelImageFile && (
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={currentCarModel.image}
                    alt="Joriy Model Rasmi"
                    className="h-16 w-16 object-contain rounded-md border"
                  />
                  <span className="text-sm text-muted-foreground">
                    Joriy rasm
                  </span>
                </div>
              )}
              <Input
                id="edit-car-model-image"
                type="file"
                accept="image/*"
                ref={editFileInputRef}
                onChange={(e) =>
                  setCurrentCarModelImageFile(
                    e.target.files ? e.target.files[0] : null
                  )
                }
              />
              {currentCarModelImageFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Yangi rasm tanlandi: {currentCarModelImageFile.name}
                </p>
              )}
              {!currentCarModel?.image && !currentCarModelImageFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Hozirda rasm yo'q. Yangisini tanlang.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* O'chirishni Tasdiqlash Dialogi */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleDeleteCarModel}
        title="Haqiqatan ham ishonchingiz komilmi?"
        description={`Bu harakatni bekor qilib bo'lmaydi. Bu mashina modelini "${currentCarModel?.name}" butunlay o'chirib tashlaydi.`}
      />
    </div>
  );
}
