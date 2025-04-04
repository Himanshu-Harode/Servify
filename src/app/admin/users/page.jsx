"use client"
import React, { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
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
import { collection, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore"
import { sendPasswordResetEmail } from "firebase/auth"

const UsersSection = () => {
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [editUser, setEditUser] = useState(null)
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
    })
    return () => unsubscribe()
  }, [])

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
      toast({ title: "Success", description: "User updated successfully", variant: "success" })
      setEditUser(null)
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handlePasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
      toast({ title: "Email Sent", description: "Password reset link sent to user's email", variant: "success" })
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(firestore, "users", userId))
        toast({ title: "Success", description: "User deleted successfully", variant: "success" })
      } catch (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      }
    }
  }

  return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">User Management</h1>
          <p className="text-muted-foreground mt-2">Manage existing user accounts</p>
        </div>

        {/* Edit User Modal */}
        {editUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background p-6 rounded-2xl w-[95%] md:w-[500px]">
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
                      <input
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="w-full p-2 rounded-xl border bg-background"
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <input
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="w-full p-2 rounded-xl border bg-background"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Mobile</Label>
                    <input
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className="w-full p-2 rounded-xl border bg-background"
                    />
                  </div>

                  <div>
                    <Label>Address</Label>
                    <input
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full p-2 rounded-xl border bg-background"
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
              </div>
            </div>
        )}

        {/* Users Table */}
        <div className="rounded-2xl border bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="rounded-tl-2xl">User</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">Address</TableHead>
                <TableHead className="rounded-tr-2xl">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{`${user.firstName} ${user.lastName}`}</span>
                        <span className="text-sm text-muted-foreground md:hidden">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col">
                        <span>{user.email}</span>
                        <span className="text-muted-foreground">{user.mobile}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{user.address}</TableCell>
                    <TableCell>
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

        {users.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FiMail className="mx-auto h-12 w-12 mb-4" />
              <p>No users found</p>
            </div>
        )}
      </div>
  )
}

export default UsersSection
