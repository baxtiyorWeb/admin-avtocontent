"use client"

import { Button } from "@/components/ui/button"

import { useState } from "react"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Package2, ChevronRight } from "lucide-react"

interface SidebarProps {
  onSelectSection: (section: string) => void
  activeSection: string
}

export default function Sidebar({ onSelectSection, activeSection }: SidebarProps) {
  const [filter, setFilter] = useState("")

  const sections = [
    { name: "Banners", key: "banners" },
    { name: "Brands", key: "brands" },
    { name: "Car Models", key: "car-models" },
    { name: "Cart", key: "cart" },
    { name: "Categories", key: "categories" },
    { name: "Orders", key: "orders" },
    { name: "Products", key: "products" },
    { name: "Users", key: "users" },
    { name: "Verify Code", key: "verify-code" },
  ]

  const filteredSections = sections.filter((section) => section.name.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div className="fixed inset-y-0 left-0 z-10 w-64 border-r bg-background flex flex-col">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="#" className="flex items-center gap-2 font-semibold text-primary">
          <Package2 className="h-6 w-6" />
          <span className="text-lg">Admin Panel</span>
        </Link>
      </div>
      <div className="p-4 border-b">
        <Input
          placeholder="Filter by tag"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full"
        />
      </div>
      <nav className="flex-1 overflow-auto py-2">
        <Accordion type="single" collapsible className="w-full" value={activeSection}>
          {filteredSections.map((section) => (
            <AccordionItem value={section.key} key={section.key}>
              <AccordionTrigger className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium hover:bg-muted/50 data-[state=open]:bg-muted/50 transition-colors">
                <div onClick={() => onSelectSection(section.key)} className="flex-1 text-left">
                  {section.name}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-90" />
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="grid gap-1 py-2">
                  <Button
                    variant="ghost"
                    className={`justify-start px-6 text-sm font-normal w-full ${activeSection === `${section.key}-view-all` ? "bg-muted text-primary" : ""}`}
                    onClick={() => onSelectSection(section.key)}
                  >
                    View All
                  </Button>
                  <Button
                    variant="ghost"
                    className={`justify-start px-6 text-sm font-normal w-full ${activeSection === `${section.key}-add-new` ? "bg-muted text-primary" : ""}`}
                    onClick={() => onSelectSection(`${section.key}-add-new`)}
                  >
                    Add New
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </nav>
    </div>
  )
}
