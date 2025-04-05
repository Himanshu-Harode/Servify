"use client"
import React, {useState, useEffect} from "react"
import {useToast} from "@/hooks/use-toast"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {FiEdit, FiTrash, FiBriefcase, FiKey} from "react-icons/fi"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {firestore, auth} from "@/context/Firebase"
import {
    collection,
    doc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    getDocs
} from "firebase/firestore"
import {sendPasswordResetEmail} from "firebase/auth"

const VendorsSection = () => {
    const {toast} = useToast()
    const [vendors, setVendors] = useState([])
    const [services, setServices] = useState([])
    const [editVendor, setEditVendor] = useState(null)
    const [formData, setFormData] = useState({
        name: "",
        mobile: "",
        service: "",
        organizationName: "",
        organizationAddress: ""
    })

    useEffect(() => {
        const unsubscribeVendors = onSnapshot(
            collection(firestore, "users"),
            (snapshot) => {
                const vendorsList = []
                snapshot.forEach((doc) => {
                    const data = doc.data()
                    if (data.role === "vendor") {
                        vendorsList.push({
                            id: doc.id,
                            name: `${data.firstName} ${data.lastName}`.trim(),
                            mobile: data.mobile,
                            service: data.service || "",
                            organizationName: data.organizationName || "",
                            organizationAddress: data.organizationAddress || "",
                            email: data.email
                        })
                    }
                })
                setVendors(vendorsList)
            },
            (error) => {
                toast({
                    title: "Error",
                    description: "Failed to load vendors: " + error.message,
                    variant: "destructive"
                })
            }
        )

        const fetchServices = async () => {
            try {
                const querySnapshot = await getDocs(collection(firestore, "service"))
                setServices(querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })))
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load services: " + error.message,
                    variant: "destructive"
                })
            }
        }

        fetchServices()
        return () => unsubscribeVendors()
    }, [toast])

    const handleInputChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value})
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const [firstName, ...lastNameParts] = formData.name.split(' ')
            const lastName = lastNameParts.join(' ') || ""

            await updateDoc(doc(firestore, "users", editVendor.id), {
                firstName,
                lastName,
                mobile: formData.mobile,
                service: formData.service,
                organizationName: formData.organizationName,
                organizationAddress: formData.organizationAddress
            })

            toast({
                title: "Success",
                description: "Vendor updated successfully",
                variant: "success"
            })
            setEditVendor(null)
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
                description: "Password reset link sent to vendor's email",
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

    const handleDelete = async (vendorId) => {
        if (window.confirm("Are you sure you want to delete this vendor?")) {
            try {
                await deleteDoc(doc(firestore, "users", vendorId))
                toast({
                    title: "Success",
                    description: "Vendor deleted successfully",
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
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary">Vendor Management</h1>
                <p className="text-muted-foreground mt-2">Manage registered service vendors</p>
            </div>

            {editVendor && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background p-6 rounded-2xl w-[95%] md:w-[600px]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Edit Vendor</h2>
                            <Button
                                onClick={() => setEditVendor(null)}
                                variant="ghost"
                                className="rounded-full h-8 w-8 p-0"
                            >
                                ×
                            </Button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Vendor Name</Label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="rounded-xl"
                                    />
                                </div>
                                <div>
                                    <Label>Mobile Number</Label>
                                    <Input
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleInputChange}
                                        className="rounded-xl"
                                        pattern="[0-9]{10}"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Service</Label>
                                <Select
                                    value={formData.service}
                                    onValueChange={(value) => {
                                        setFormData({...formData, service: value})
                                    }}
                                >
                                    <SelectTrigger className="rounded-xl h-12">
                                        <SelectValue placeholder="Select service"/>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl bg-background">
                                        {services.map((service) => (
                                            <SelectItem
                                                key={service.id}
                                                value={service.name}
                                                className="rounded-lg"
                                            >
                                                {service.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Organization Name</Label>
                                    <Input
                                        name="organizationName"
                                        value={formData.organizationName}
                                        onChange={handleInputChange}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div>
                                    <Label>Organization Address</Label>
                                    <Input
                                        name="organizationAddress"
                                        value={formData.organizationAddress}
                                        onChange={handleInputChange}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditVendor(null)}
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

            <div className="rounded-2xl border bg-card shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="rounded-tl-2xl">Sr</TableHead>
                            <TableHead className="rounded-tl-2xl">Vendor</TableHead>
                            <TableHead className="hidden md:table-cell">Service</TableHead>
                            <TableHead className="hidden lg:table-cell">Organization</TableHead>
                            <TableHead className="rounded-tr-2xl">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vendors.map((vendor,index) => (
                            <TableRow key={vendor.id} className="hover:bg-muted/10 transition-colors">
                                <TableCell className="hidden md:table-cell">
                  <span className="px-2 py-1   rounded-full text-xs">
                    {index+1}
                  </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{vendor.name}</span>
                                        <span className="text-sm text-muted-foreground ">
                                    {vendor.mobile}
                                    </span>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                  <span className="px-4 py-1 bg-primary/80 text-white  rounded-full text-xs">
                    {vendor.service}
                  </span>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                    <div className="flex flex-col">
                                        <span>{vendor.organizationName}</span>
                                        <span className="text-sm text-muted-foreground">
                      {vendor.organizationAddress}
                    </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditVendor(vendor)
                                                setFormData({
                                                    name: vendor.name,
                                                    mobile: vendor.mobile,
                                                    service: vendor.service || "",
                                                    organizationName: vendor.organizationName,
                                                    organizationAddress: vendor.organizationAddress
                                                })
                                            }}
                                            className="rounded-full p-2 h-8 w-8"
                                        >
                                            <FiEdit className="w-4 h-4"/>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePasswordReset(vendor.email)}
                                            className="rounded-full p-2 h-8 w-8"
                                        >
                                            <FiKey className="w-4 h-4"/>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(vendor.id)}
                                            className="rounded-full p-2 h-8 w-8"
                                        >
                                            <FiTrash className="w-4 h-4"/>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {vendors.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <FiBriefcase className="mx-auto h-12 w-12 mb-4"/>
                    <p>No vendors found</p>
                </div>
            )}
        </div>
    )
}

export default VendorsSection
