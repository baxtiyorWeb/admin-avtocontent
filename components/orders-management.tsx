"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetcher } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface OrderItem {
  product_id: number
  quantity: number
}

interface Order {
  id: number // Assuming an ID for orders
  full_name: string
  phone_number: string
  address: string
  images: string[] // Assuming image URLs related to the order
  items: OrderItem[]
  cart_id: number
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  const fetchOrders = async (search = "") => {
    setLoading(true)
    try {
      // Assuming a GET endpoint for orders, possibly with search
      const data = await fetcher<Order[]>(`/orders?search=${search}`)
      setOrders(data)
      toast({
        title: "Success",
        description: "Orders loaded successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load orders: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(searchQuery)
  }, [searchQuery])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>View customer orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders by name or phone..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9"
            />
          </div>
          {loading && orders.length === 0 ? (
            <div className="text-center py-4">Loading orders...</div>
          ) : orders.length === 0 && !loading ? (
            <div className="text-center py-4 text-muted-foreground">No orders found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Cart ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.full_name}</TableCell>
                    <TableCell>{order.phone_number}</TableCell>
                    <TableCell className="max-w-[250px] truncate">{order.address}</TableCell>
                    <TableCell>
                      {order.items.map((item) => (
                        <div key={item.product_id}>
                          Product ID: {item.product_id}, Qty: {item.quantity}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>{order.cart_id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
