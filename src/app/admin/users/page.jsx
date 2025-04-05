"use client"
import React, { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FiEdit, FiTrash, FiKey, FiMail } from "react-icons/fi"
import { firestore, auth } from "@/context/Firebase"
import { collection, doc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore"
import { sendPasswordResetEmail } from "firebase/auth"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const UsersSection = () => {
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [editUser, setEditUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    address: ""
  })

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "users"), (snapshot) => {
      const usersList = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.role === "user") {
          usersList.push({
            id: doc.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            mobile: data.mobile,
            address: data.address || "",
            role: data.role
          })
        }
      })
      setUsers(usersList)
      setLoading(false)
    }, (error) => {
      toast({
        title: "Error",
        description: "Failed to load users: " + error.message,
        variant: "destructive"
      })
      setLoading(false)
    })
    return () => unsubscribe()
  }, [toast])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateDoc(doc(firestore, "users", editUser.id), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobile: formData.mobile,
        address: formData.address
      })
      toast({
        title: "Success",
        description: "User updated successfully",
        variant: "success"
      })
      setEditUser(null)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handlePasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
      toast({
        title: "Email Sent",
        description: "Password reset link sent to user's email",
        variant: "success"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(firestore, "users", userId))
        toast({
          title: "Success",
          description: "User deleted successfully",
          variant: "success"
        })
      } catch (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        })
      }
    }
  }

  return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">User Management</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Manage existing user accounts
          </p>
        </div>

        {/* Edit User Modal */}
        {editUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="p-6 w-[95%] md:w-[500px]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Edit User</h2>
                  <Button
                      onClick={() => setEditUser(null)}
                      variant="ghost"
                      className="rounded-full h-8 w-8 p-0"
                  >
                    ×
                  </Button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <Input
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Mobile</Label>
                    <Input
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className="rounded-xl"
                    />
                  </div>

                  <div>
                    <Label>Address</Label>
                    <Input
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="rounded-xl"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditUser(null)}
                        className="rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="rounded-xl">
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
        )}

        {/* Users Table */}
        <Card className="rounded-xl md:rounded-2xl shadow-sm">
          {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
          ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FiMail className="mx-auto h-12 w-12 mb-4" />
                <p>No users found</p>
              </div>
          ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="rounded-tl-xl md:rounded-tl-2xl px-4">Sr</TableHead>
                      <TableHead className="px-4">User</TableHead>
                      <TableHead className="hidden md:table-cell px-4">Contact</TableHead>
                      <TableHead className="hidden lg:table-cell px-4">Address</TableHead>
                      <TableHead className="rounded-tr-xl md:rounded-tr-2xl px-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                        <TableRow key={user.id} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="px-4 py-3">{index + 1}</TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{`${user.firstName} ${user.lastName}`}</span>
                              <span className="text-xs text-muted-foreground md:hidden">
                          {user.email}
                        </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell px-4 py-3">
                            <div className="flex flex-col">
                              <span>{user.email}</span>
                              <span className="text-sm text-muted-foreground">{user.mobile}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell px-4 py-3 w-[350px]">
                            {user.address}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditUser(user)
                                    setFormData({
                                      firstName: user.firstName,
                                      lastName: user.lastName,
                                      mobile: user.mobile,
                                      address: user.address || ""
                                    })
                                  }}
                                  className="rounded-full p-2 h-8 w-8"
                              >
                                <FiEdit className="w-4 h-4" />
                              </Button>
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePasswordReset(user.email)}
                                  className="rounded-full p-2 h-8 w-8"
                              >
                                <FiKey className="w-4 h-4" />
                              </Button>
                              <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(user.id)}
                                  className="rounded-full p-2 h-8 w-8"
                              >
                                <FiTrash className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
          )}
        </Card>
      </div>
  )
}

export default UsersSection
