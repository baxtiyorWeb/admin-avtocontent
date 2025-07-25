"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import CategoriesManagement from "@/components/categories-management"
import BannersManagement from "@/components/banners-management"
import BrandsManagement from "@/components/brands-management"
import CarModelsManagement from "@/components/car-models-management"
import ProductsManagement from "@/components/products-management"
import OrdersManagement from "@/components/orders-management"
import UsersManagement from "@/components/users-management"
import { Toaster } from "@/components/ui/toaster"

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("categories")

  const renderContent = () => {
    switch (activeSection) {
      case "categories":
      case "categories-view-all":
      case "categories-add-new":
        return <CategoriesManagement />
      case "banners":
      case "banners-view-all":
      case "banners-add-new":
        return <BannersManagement />
      case "brands":
      case "brands-view-all":
      case "brands-add-new":
        return <BrandsManagement />
      case "car-models":
      case "car-models-view-all":
      case "car-models-add-new":
        return <CarModelsManagement />
      case "products":
      case "products-view-all":
      case "products-add-new":
        return <ProductsManagement />
      case "orders":
      case "orders-view-all":
        return <OrdersManagement />
      case "users":
      case "users-view-all":
      case "users-add-new":
        return <UsersManagement />
      case "cart": // Cart actions (add_item, remove_item, update-item, checkout) are not direct CRUD resources for an admin panel
      case "verify-code": // Verify code is an action, not a CRUD resource
        return (
          <div className="p-6 text-center text-muted-foreground">
            <h2 className="text-2xl font-bold mb-2">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace("-", " ")}
            </h2>
            <p>
              This section represents API actions rather than direct data management.
              <br />
              For example, "Cart" includes actions like `add_item`, `remove_item`, `update-item`, and `checkout`.
              <br />
              "Verify Code" is for phone verification.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Note: Features like dollar exchange rate, card number management, and product comment deletion/reply are
              not implemented as corresponding API endpoints were not provided in the documentation.
            </p>
          </div>
        )
      default:
        return (
          <div className="p-6 text-center text-muted-foreground">
            <h2 className="text-2xl font-bold mb-2">Welcome to your Admin Panel</h2>
            <p>Select an item from the sidebar to manage your data.</p>
          </div>
        )
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-100/40">
      <Sidebar onSelectSection={setActiveSection} activeSection={activeSection} />
      <div className="flex flex-col flex-1 ml-64">
        <header className="sticky top-0 z-0 flex h-16 items-center gap-4 border-b bg-background px-4">
          <h1 className="text-xl font-semibold">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace("-", " ")}
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-6">{renderContent()}</main>
      </div>
      <Toaster />
    </div>
  )
}
