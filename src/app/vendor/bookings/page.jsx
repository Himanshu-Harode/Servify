"use client"

import { useEffect, useState } from "react"
import { auth, firestore } from "@/context/Firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  getDoc,
} from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Info,
  Search,
  ArrowUpDown,
} from "lucide-react"
import Loading from "@/app/loading" // Updated Loading component

const VendorBookingPage = () => {
  const [bookings, setBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [cancelReason, setCancelReason] = useState("")
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortOrder, setSortOrder] = useState("desc")

  // Fetch bookings from Firestore
  useEffect(() => {
    const fetchBookings = async (vendorId) => {
      try {
        const bookingsQuery = query(
          collection(firestore, "bookings"),
          where("vendorId", "==", vendorId),
          orderBy("date", sortOrder)
        )
        const querySnapshot = await getDocs(bookingsQuery)

        const bookingsData = await Promise.all(
          querySnapshot.docs.map(async (bookingDoc) => {
            const booking = bookingDoc.data()
            const customerId = booking.userId

            let customerName = "Unknown"
            let profileImage = ""
            if (customerId) {
              const customerRef = doc(firestore, "users", customerId)
              const customerDoc = await getDoc(customerRef)
              if (customerDoc.exists()) {
                const customerData = customerDoc.data()
                customerName = `${customerData.firstName || ""} ${
                  customerData.lastName || ""
                }`.trim()
                profileImage = customerData.profileImage || ""
              }
            }

            return {
              id: bookingDoc.id,
              customerName,
              profileImage,
              service: booking.vendorService,
              date: booking.date,
              time: booking.time,
              status: booking.status,
              cancelReason: booking.cancelReason || "",
              timestamp: booking.date,
            }
          })
        )

        setBookings(bookingsData)
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchBookings(user.uid)
    })

    return () => unsubscribe()
  }, [sortOrder])

  // Filter and sort bookings
  const filteredBookings = bookings
    .filter((booking) => {
      const matchesSearch =
        booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.service.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus =
        filterStatus === "all" || booking.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) =>
      sortOrder === "asc"
        ? a.timestamp - b.timestamp
        : b.timestamp - a.timestamp
    )

  // Booking status handlers
  const handleStatusChange = async (id, newStatus) => {
    try {
      const bookingRef = doc(firestore, "bookings", id)
      await updateDoc(bookingRef, { status: newStatus })

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === id ? { ...booking, status: newStatus } : booking
        )
      )
    } catch (error) {
      console.error("Error updating booking status:", error)
    }
  }

  const handleCancelBooking = async (id) => {
    try {
      const bookingRef = doc(firestore, "bookings", id)
      await updateDoc(bookingRef, {
        status: "cancelled",
        cancelReason,
      })

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === id
            ? { ...booking, status: "cancelled", cancelReason }
            : booking
        )
      )
      setIsCancelModalOpen(false)
      setCancelReason("")
    } catch (error) {
      console.error("Error cancelling booking:", error)
    }
  }

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusColors = {
      booked: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
      accepted:
        "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100",
      completed:
        "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-sm ${statusColors[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) return <Loading />

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        📅 Bookings Management
      </h1>
      <Tabs defaultValue="new">
        <TabsList className="grid grid-cols-3 w-full bg-background">
          <TabsTrigger
            value="new"
            className="data-[state=active]:bg-blue-500 rounded-[5px] data-[state=active]:text-white"
          >
            New Bookings ({bookings.filter((b) => b.status === "booked").length}
            )
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-blue-500 rounded-[5px] data-[state=active]:text-white"
          >
            Pending ({bookings.filter((b) => b.status === "accepted").length})
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-blue-500 rounded-[5px] data-[state=active]:text-white"
          >
            All Services ({bookings.length})
          </TabsTrigger>
        </TabsList>
        <div className="my-4 flex flex-col md:flex-row gap-4">
          {" "}
          <div className="relative flex-1">
            {" "}
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />{" "}
            <Input
              placeholder="Search by name or service..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />{" "}
          </div>{" "}
          <div className="flex gap-2">
            {" "}
            <select
              className="border rounded-lg p-2 bg-white dark:bg-gray-800 dark:text-gray-100"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {" "}
              <option value="all">All Statuses</option>{" "}
              <option value="booked">Booked</option>{" "}
              <option value="accepted">Accepted</option>{" "}
              <option value="completed">Completed</option>{" "}
              <option value="cancelled">Cancelled</option>{" "}
            </select>{" "}
            <Button
              variant="outline"
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
            >
              {" "}
              <ArrowUpDown className="mr-2 h-4 w-4" />{" "}
              {sortOrder === "asc" ? "Oldest First" : "Newest First"}{" "}
            </Button>{" "}
          </div>{" "}
        </div>
        {/* New Bookings Tab */}
        <TabsContent value="new">
          <div className="space-y-4">
            {filteredBookings
              .filter((b) => b.status === "booked")
              .map((booking) => (
                <Card
                  key={booking.id}
                  className="p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {booking.profileImage ? (
                          <img
                            src={booking.profileImage}
                            alt={booking.customerName}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <User className="w-8 h-8 text-gray-500" />
                        )}
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {booking.customerName}
                        </p>
                        <StatusBadge status={booking.status} />
                      </div>
                      {/* <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {booking.service}
                        </p>
                      </div> */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {booking.date} at {booking.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          handleStatusChange(booking.id, "accepted")
                        }
                        className="bg-green-500 rounded-[3px] hover:bg-green-600"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Accept
                      </Button>
                      <Button
                        className="rounded-[3px]"
                        variant="destructive"
                        onClick={() => {
                          setSelectedBooking(booking)
                          setIsCancelModalOpen(true)
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" /> Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Pending Bookings Tab */}
        <TabsContent value="pending">
          <div className="space-y-4">
            {filteredBookings
              .filter((b) => b.status === "accepted")
              .map((booking) => (
                <Card
                  key={booking.id}
                  className="p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {booking.profileImage ? (
                          <img
                            src={booking.profileImage}
                            alt={booking.customerName}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <User className="w-8 h-8 text-gray-500" />
                        )}
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {booking.customerName}
                        </p>
                        <StatusBadge status={booking.status} />
                      </div>
                      {/* <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {booking.service}
                        </p>
                      </div> */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {booking.date} at {booking.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          handleStatusChange(booking.id, "completed")
                        }
                        className="bg-blue-500 rounded-[3px] hover:bg-blue-600"
                      >
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* All Services Tab */}
        <TabsContent value="all">
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card
                key={booking.id}
                className="p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {booking.profileImage ? (
                        <img
                          src={booking.profileImage}
                          alt={booking.customerName}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <User className="w-8 h-8 text-gray-500" />
                      )}
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {booking.customerName}
                      </p>
                      <StatusBadge status={booking.status} />
                    </div>
                    {/* <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.service}
                      </p>
                    </div> */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.date} at {booking.time}
                      </p>
                    </div>
                    {booking.status === "cancelled" && booking.cancelReason && (
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Reason: {booking.cancelReason}
                      </div>
                    )}
                  </div>
                  {booking.status === "booked" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          handleStatusChange(booking.id, "accepted")
                        }
                        className="bg-green-500 rounded-[3px] hover:bg-green-600"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Accept
                      </Button>
                      <Button
                        className="rounded-[3px]"
                        variant="destructive"
                        onClick={() => {
                          setSelectedBooking(booking)
                          setIsCancelModalOpen(true)
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" /> Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default VendorBookingPage
