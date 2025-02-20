"use client"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { firestore, auth } from "@/context/Firebase"
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

const Booking = () => {
  const { toast } = useToast()
  const [bookings, setBookings] = useState([])
  const [completedBookings, setCompletedBookings] = useState([])
  const [allBookings, setAllBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellationReason, setCancellationReason] = useState("")
  const [selectedBooking, setSelectedBooking] = useState(null)

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return

      const q = query(
        collection(firestore, "bookings"),
        where("userId", "==", user.uid),
        where("status", "in", ["booked", "accepted"])
      )

      const unsubscribeActive = onSnapshot(q, (snapshot) => {
        const activeBookings = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setBookings(activeBookings)
      })

      const completedQ = query(
        collection(firestore, "bookings"),
        where("userId", "==", user.uid),
        where("status", "==", "completed")
      )

      const unsubscribeCompleted = onSnapshot(completedQ, (snapshot) => {
        const completed = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setCompletedBookings(completed)
      })

      const allQ = query(
        collection(firestore, "bookings"),
        where("userId", "==", user.uid)
      )

      const unsubscribeAll = onSnapshot(allQ, (snapshot) => {
        const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setAllBookings(all)
        setLoading(false)
      })

      return () => {
        unsubscribeActive()
        unsubscribeCompleted()
        unsubscribeAll()
      }
    })

    return () => unsubscribeAuth()
  }, [])

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const bookingRef = doc(firestore, "bookings", bookingId)
      await updateDoc(bookingRef, {
        status: newStatus,
        ...(newStatus === "cancelled" && {
          cancellationReason,
          cancelledAt: new Date(),
        }),
      })

      toast({
        title: "Booking Updated",
        description: `Booking has been ${newStatus}`,
        className: "bg-green-500 text-white",
      })
      setCancellationReason("")
      setSelectedBooking(null)
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status) => {
    const statusColors = {
      booked: "bg-blue-500 hover:bg-blue-600",
      accepted: "bg-purple-500 hover:bg-purple-600",
      completed: "bg-green-500 hover:bg-green-600",
      cancelled: "bg-red-500 hover:bg-red-600",
    }
    return (
      <Badge className={`${statusColors[status]} text-white capitalize`}>
        {status}
      </Badge>
    )
  }

  // Sorting function
  const sortByDate = (a, b) => b.createdAt?.seconds - a.createdAt?.seconds

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Tabs defaultValue="bookings">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger
            value="bookings"
            className="py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            Active
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            Completed
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            All Bookings
          </TabsTrigger>
        </TabsList>

        {/* Active Bookings Tab */}
        <TabsContent value="bookings">
          <div className="mt-6 space-y-4">
            <AnimatePresence>
              {loading ? (
                Array(3)
                  .fill()
                  .map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                  ))
              ) : bookings.sort(sortByDate).length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-muted-foreground py-8"
                >
                  No active bookings found
                </motion.div>
              ) : (
                bookings.sort(sortByDate).map((booking) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-card rounded-lg p-4 shadow-sm border"
                  >
                    {/* ... rest of active bookings content ... */}
                    <div className="flex items-center justify-between">
                      {/* Image and Vendor Information */}
                      <div className="flex items-center gap-4">
                        <div className="relative h-20 w-20 shrink-0">
                          <Image
                            src={
                              booking.vendorProfile || "/placeholder-user.png"
                            }
                            alt={booking.vendorName}
                            fill
                            className="rounded-full object-cover"
                            sizes="(max-width: 768px) 100px, 100px"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              {booking.vendorName}
                            </h3>
                            {getStatusBadge(booking.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {booking.vendorService}
                          </p>
                          <p className="text-sm text-primary">
                            Booked on{" "}
                            {new Date(
                              booking.createdAt?.seconds * 1000
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 md:flex-row items-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                              className="rounded-[5px]"
                            >
                              Cancel
                            </Button>
                          </DialogTrigger>

                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cancel Booking</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Reason for cancellation"
                                value={cancellationReason}
                                onChange={(e) =>
                                  setCancellationReason(e.target.value)
                                }
                                className="rounded-[5px]"
                              />
                              <Button
                                onClick={() =>
                                  handleStatusUpdate(booking.id, "cancelled")
                                }
                                disabled={!cancellationReason}
                                className="rounded-[5px]"
                              >
                                Submit Cancellation
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          // variant="secondary"
                          size="sm" className="rounded-[5px] bg-primary"
                          onClick={() =>
                            handleStatusUpdate(booking.id, "completed")
                          }
                        >
                          Mark Complete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* Completed Bookings Tab */}
        <TabsContent value="completed">
          <div className="mt-6 space-y-4">
            <AnimatePresence>
              {loading ? (
                Array(3)
                  .fill()
                  .map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                  ))
              ) : completedBookings.sort(sortByDate).length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-muted-foreground py-8"
                >
                  No completed bookings
                </motion.div>
              ) : (
                completedBookings.sort(sortByDate).map((booking) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-lg p-4 shadow-sm border"
                  >
                    {/* ... rest of completed bookings content ... */}
                    <div className="flex items-center justify-between">
                      {/* Image and Vendor Information */}
                      <div className="flex items-center gap-4">
                        <div className="relative h-20 w-20 shrink-0">
                          <Image
                            src={
                              booking.vendorProfile || "/placeholder-user.png"
                            }
                            alt={booking.vendorName}
                            fill
                            className="rounded-full object-cover"
                            sizes="(max-width: 768px) 100px, 100px"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              {booking.vendorName}
                            </h3>
                            {getStatusBadge(booking.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {booking.vendorService}
                          </p>
                          <p className="text-sm text-primary">
                            Completed on{" "}
                            {new Date(
                              booking.createdAt?.seconds * 1000
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* All Bookings Tab */}
        <TabsContent value="all">
          <div className="mt-6 space-y-4">
            <AnimatePresence>
              {loading ? (
                Array(3)
                  .fill()
                  .map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                  ))
              ) : allBookings
                  .filter((b) => ["completed", "cancelled"].includes(b.status))
                  .sort(sortByDate).length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-muted-foreground py-8"
                >
                  No bookings found
                </motion.div>
              ) : (
                allBookings
                  .filter((b) => ["completed", "cancelled"].includes(b.status))
                  .sort(sortByDate)
                  .map((booking) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card rounded-lg p-4 shadow-sm border"
                    >
                      {/* ... rest of all bookings content ... */}
                      <div className="flex items-center justify-between">
                        {/* Image and Vendor Information */}
                        <div className="flex items-center gap-4">
                          <div className="relative h-20 w-20 shrink-0">
                            <Image
                              src={
                                booking.vendorProfile || "/placeholder-user.png"
                              }
                              alt={booking.vendorName}
                              fill
                              className="rounded-full object-cover"
                              sizes="(max-width: 768px) 100px, 100px"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">
                                {booking.vendorName}
                              </h3>
                              {getStatusBadge(booking.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {booking.vendorService}
                            </p>
                            <p className="text-sm text-primary">
                              {new Date(
                                booking.createdAt?.seconds * 1000
                              ).toLocaleDateString()}
                            </p>
                            {booking.cancellationReason && (
                              <p className="text-sm text-destructive">
                                Cancellation Reason:{" "}
                                {booking.cancellationReason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {booking.status === "booked" ||
                        booking.status === "accepted" ? (
                          <div className="flex gap-2 w-full md:w-auto">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setSelectedBooking(booking)}
                                >
                                  Cancel
                                </Button>
                              </DialogTrigger>

                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Cancel Booking</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Textarea
                                    placeholder="Reason for cancellation"
                                    value={cancellationReason}
                                    onChange={(e) =>
                                      setCancellationReason(e.target.value)
                                    }
                                  />
                                  <Button
                                    onClick={() =>
                                      handleStatusUpdate(
                                        booking.id,
                                        "cancelled"
                                      )
                                    }
                                    disabled={!cancellationReason}
                                  >
                                    Submit Cancellation
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                handleStatusUpdate(booking.id, "completed")
                              }
                            >
                              Complete
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  ))
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Booking