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
import { fetcher } from "@/lib/api-client"; // fetcher funksiyangizni import qiling
import { useToast } from "@/hooks/use-toast"; // useToast hook'ingizni import qiling
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog"; // ConfirmDialog komponentingizni import qiling

// Brend ob'ektining interfeysi
interface Brand {
  id: number;
  name: string;
  // Agar brend ob'ektida boshqa maydonlar bo'lsa, bu yerga qo'shing
  // Masalan: description?: string; is_active?: boolean;
}

export default function BrandsManagement() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [newBrandName, setNewBrandName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Brendlarni API dan yuklab olish funksiyasi
  const fetchBrands = async (search = "") => {
    setLoading(true);
    try {
      const response = await fetcher<{ results?: Brand[] }>( // Assuming paginated response
        `/banners?search=${search}`
      );

      // This is crucial: Check if response.results exists and is an array
      if (Array.isArray(response?.results)) {
        setBrands(response.results); // Set state with the array from 'results'
      } else {
        // If the API returns a different structure or no 'results', handle it
        throw new Error(
          "Invalid response: results is not an array for brands."
        );
      }

      // ... (toast success) ...
    } catch (error: any) {
      // ... (toast error) ...
    } finally {
      setLoading(false);
    }
  };

  // Yangi brend yaratish funksiyasi
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) {
      toast({
        title: "Xatolik",
        description: "Brend nomi bo'sh bo'lishi mumkin emas.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const createdBrand = await fetcher<Brand>("/brands/", "POST", {
        // POST endpoint
        name: newBrandName,
      });

      // Brendlar ro'yxatini yangilash, xatolik yuzaga kelmasligi uchun avvalgi state'ni tekshiramiz
      setBrands((prevBrands) => [...(prevBrands || []), createdBrand]);
      setNewBrandName(""); // Inputni tozalash

      toast({
        title: "Muvaffaqiyatli",
        description: `"${createdBrand.name}" brendi muvaffaqiyatli yaratildi.`,
      });

      setTimeout(() => {
        window.location.href = "/";
      }, 800);
      fetchBrands(searchQuery); // Ro'yxatni yangilash
    } catch (error: any) {
      console.error("Failed to create brand:", error);
      toast({
        title: "Xatolik",
        description: `Brend yaratishda xatolik yuz berdi: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Brendni tahrirlash funksiyasi
  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBrand || !currentBrand.name.trim()) {
      toast({
        title: "Xatolik",
        description: "Brend nomi bo'sh bo'lishi mumkin emas.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const updatedBrand = await fetcher<Brand>(
        `/banners/${currentBrand.id}/`, // PATCH endpoint
        "PATCH",
        {
          name: currentBrand.name,
          // Agar boshqa maydonlar bo'lsa, ularni ham bu yerga qo'shing
        }
      );

      setBrands(
        brands.map((brand) =>
          brand.id === updatedBrand.id ? updatedBrand : brand
        )
      );
      setIsEditDialogOpen(false);
      setCurrentBrand(null);
      toast({
        title: "Muvaffaqiyatli",
        description: `"${updatedBrand.name}" brendi muvaffaqiyatli yangilandi.`,
      });
    } catch (error: any) {
      console.error("Failed to update brand:", error);
      toast({
        title: "Xatolik",
        description: `Brendni yangilashda xatolik yuz berdi: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Brendni o'chirish funksiyasi
  const handleDeleteBrand = async () => {
    if (!currentBrand) return;

    setLoading(true);
    try {
      await fetcher(`/banners/${currentBrand.id}/`, "DELETE"); // DELETE endpoint
      setBrands(brands.filter((brand) => brand.id !== currentBrand.id));
      setIsConfirmDialogOpen(false);
      setCurrentBrand(null);
      toast({
        title: "Muvaffaqiyatli",
        description: `"${currentBrand.name}" brendi muvaffaqiyatli o'chirildi.`,
      });
    } catch (error: any) {
      console.error("Failed to delete brand:", error);
      toast({
        title: "Xatolik",
        description: `Brendni o'chirishda xatolik yuz berdi: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // `searchQuery` o'zgarganda brendlarni qayta yuklash
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
          <CardTitle>Yangi Brend Yaratish</CardTitle>
          <CardDescription>Yangi avtomobil brendini qo'shing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateBrand} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-brand-name">Brend Nomi</Label>
              <Input
                id="new-brand-name"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Brend nomini kiriting"
                required
              />
            </div>
            <Button type="submit" className="w-fit" disabled={loading}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {loading ? "Yaratilmoqda..." : "Brend Yaratish"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mavjud Brendlar</CardTitle>
          <CardDescription>
            Avtomobil brendlarini ko'rish va boshqarish.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Brendlarni nom bo'yicha qidirish..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9"
            />
          </div>
          {loading && brands.length === 0 ? (
            <div className="text-center py-4">Brendlar yuklanmoqda...</div>
          ) : brands.length === 0 && !loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Brendlar topilmadi.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nomi</TableHead>
                  <TableHead className="text-right">Harakatlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>{brand.id}</TableCell>
                    <TableCell>{brand.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentBrand(brand);
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
                          setCurrentBrand(brand);
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

      {/* Brendni Tahrirlash Dialogi */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Brendni Tahrirlash</DialogTitle>
            <CardDescription>
              Brend ma'lumotlarini bu yerda o'zgartiring.
            </CardDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBrand} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-brand-name">Nomi</Label>
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
        onConfirm={handleDeleteBrand}
        title="Haqiqatan ham ishonchingiz komilmi?"
        description={`Bu harakatni bekor qilib bo'lmaydi. Bu "${currentBrand?.name}" brendini butunlay o'chirib tashlaydi.`}
      />
    </div>
  );
}
