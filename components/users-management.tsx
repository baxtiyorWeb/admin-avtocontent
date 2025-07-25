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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface User {
  id: number; // Assuming an ID for users
  username: string;
  phone_number: string;
  is_verified: boolean;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({
    username: "",
    phone_number: "",
    is_verified: false,
  });
  const [loading, setLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchUsers = async (search = "") => {
    setLoading(true);
    try {
      const data = await fetcher<User[]>(`/users?search=${search}`); // Assuming GET /users endpoint
      setUsers(data?.results);
      toast({
        title: "Success",
        description: "Users loaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load users: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.phone_number) {
      toast({
        title: "Error",
        description: "Username and phone number are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const createdUser = await fetcher<User>("/users/", "POST", newUser);
      setUsers([...users, createdUser]);
      setNewUser({ username: "", phone_number: "", is_verified: false });
      toast({
        title: "Success",
        description: `User "${createdUser.username}" created successfully.`,
      });
      fetchUsers(searchQuery); // Refresh list
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create user: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const updatedUser = await fetcher<User>(
        `/users/${currentUser.id}/`,
        "PATCH",
        currentUser
      );
      setUsers(
        users.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      );
      setIsEditDialogOpen(false);
      setCurrentUser(null);
      toast({
        title: "Success",
        description: `User "${updatedUser.username}" updated successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      await fetcher(`/users/${currentUser.id}/`, "DELETE");
      setUsers(users.filter((user) => user.id !== currentUser.id));
      setIsConfirmDialogOpen(false);
      setCurrentUser(null);
      toast({
        title: "Success",
        description: `User "${currentUser.username}" deleted successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(searchQuery);
  }, [searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>Add a new user to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreateUser}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="grid gap-2">
              <Label htmlFor="new-user-username">Username</Label>
              <Input
                id="new-user-username"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
                placeholder="Enter username"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-phone">Phone Number</Label>
              <Input
                id="new-user-phone"
                value={newUser.phone_number}
                onChange={(e) =>
                  setNewUser({ ...newUser, phone_number: e.target.value })
                }
                placeholder="e.g., +1234567890"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="new-is_verified"
                checked={newUser.is_verified}
                onCheckedChange={(checked) =>
                  setNewUser({ ...newUser, is_verified: Boolean(checked) })
                }
              />
              <Label htmlFor="new-is_verified">Is Verified?</Label>
            </div>
            <Button type="submit" className="md:col-span-2" disabled={loading}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {loading ? "Creating..." : "Create User"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Users</CardTitle>
          <CardDescription>View and manage users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by username or phone..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9"
            />
          </div>
          {loading && users.length === 0 ? (
            <div className="text-center py-4">Loading users...</div>
          ) : users.length === 0 && !loading ? (
            <div className="text-center py-4 text-muted-foreground">
              No users found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.phone_number}</TableCell>
                    <TableCell>{user.is_verified ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentUser(user);
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
                          setCurrentUser(user);
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <CardDescription>Make changes to the user here.</CardDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-user-username">Username</Label>
              <Input
                id="edit-user-username"
                value={currentUser?.username || ""}
                onChange={(e) =>
                  setCurrentUser((prev) =>
                    prev ? { ...prev, username: e.target.value } : null
                  )
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-user-phone">Phone Number</Label>
              <Input
                id="edit-user-phone"
                value={currentUser?.phone_number || ""}
                onChange={(e) =>
                  setCurrentUser((prev) =>
                    prev ? { ...prev, phone_number: e.target.value } : null
                  )
                }
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-is_verified"
                checked={currentUser?.is_verified || false}
                onCheckedChange={(checked) =>
                  setCurrentUser((prev) =>
                    prev ? { ...prev, is_verified: Boolean(checked) } : null
                  )
                }
              />
              <Label htmlFor="edit-is_verified">Is Verified?</Label>
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
        onConfirm={handleDeleteUser}
        title="Are you absolutely sure?"
        description={`This action cannot be undone. This will permanently delete the user "${currentUser?.username}".`}
      />
    </div>
  );
}
