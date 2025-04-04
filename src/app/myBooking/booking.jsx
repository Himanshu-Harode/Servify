"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { firestore, auth } from "@/context/Firebase";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Star } from "lucide-react";
import { DialogDescription } from "@radix-ui/react-dialog";
import { onAuthStateChanged } from "firebase/auth";

const Booking = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [bookingToRate, setBookingToRate] = useState(null);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";

    if (typeof timestamp.toDate === "function") {
      const date = timestamp.toDate();
      return formatDate(date);
    }

    if (timestamp instanceof Date) {
      return formatDate(timestamp);
    }

    if (typeof timestamp === "string") {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return formatDate(date);
      }
    }

    return "N/A";
  };

  const formatDate = (date) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return date.toLocaleDateString("en-GB", options).replace(/\//g, "-");
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const q = query(
        collection(firestore, "bookings"),
        where("userId", "==", user.uid),
        where("status", "in", ["booked", "accepted"])
      );

      const unsubscribeActive = onSnapshot(q, (snapshot) => {
        const activeBookings = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt,
        }));
        setBookings(activeBookings);
      });

      const completedQ = query(
        collection(firestore, "bookings"),
        where("userId", "==", user.uid),
        where("status", "==", "completed")
      );

      const unsubscribeCompleted = onSnapshot(completedQ, (snapshot) => {
        const completed = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt,
          completedAt: doc.data().completedAt,
          rating: doc.data().rating,
          review: doc.data().review,
          ratedAt: doc.data().ratedAt,
        }));
        setCompletedBookings(completed);

        const unratedBooking = completed.find((booking) => !booking.rating);
        if (unratedBooking) {
          setBookingToRate(unratedBooking);
          setShowRatingPopup(true);
        }
      });

      const allQ = query(
        collection(firestore, "bookings"),
        where("userId", "==", user.uid)
      );

      const unsubscribeAll = onSnapshot(allQ, (snapshot) => {
        const all = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt,
          cancelledAt: doc.data().cancelledAt,
          completedAt: doc.data().completedAt,
          rating: doc.data().rating,
          review: doc.data().review,
          ratedAt: doc.data().ratedAt,
        }));
        setAllBookings(all);
        setLoading(false);
      });

      return () => {
        unsubscribeActive();
        unsubscribeCompleted();
        unsubscribeAll();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const bookingRef = doc(firestore, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
        ...(newStatus === "cancelled" && {
          cancellationReason,
          cancelledAt: serverTimestamp(),
        }),
      });
      toast({
        title: "Booking Updated",
        description: `Booking has been ${newStatus}`,
        variant: "success",
      });
      setCancellationReason("");
      setSelectedBooking(null);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRatingSubmit = async () => {
    if (!bookingToRate || rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const bookingRef = doc(firestore, "bookings", bookingToRate.id);
      await updateDoc(bookingRef, {
        rating,
        review: reviewText,
        ratedAt: serverTimestamp(),
      });

      const vendorRef = doc(firestore, "users", bookingToRate.vendorId);
      const vendorDoc = await getDoc(vendorRef);
      const vendorData = vendorDoc.data();

      const newTotalRatings = (vendorData.totalRatings || 0) + 1;
      const newRatingSum = (vendorData.ratingSum || 0) + rating;
      const newAverageRating = (newRatingSum / newTotalRatings).toFixed(1);

      await updateDoc(vendorRef, {
        totalRatings: newTotalRatings,
        ratingSum: newRatingSum,
        averageRating: newAverageRating,
      });

      toast({
        title: "Rating Submitted",
        description: "Thank you for rating the vendor!",
        variant: "success",
      });

      setShowRatingPopup(false);
      setRating(0);
      setReviewText("");
      setBookingToRate(null);
    } catch (error) {
      toast({
        title: "Rating Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      booked: "bg-blue-500 hover:bg-blue-600",
      accepted: "bg-purple-500 hover:bg-purple-600",
      completed: "bg-green-500 hover:bg-green-600",
      cancelled: "bg-red-500 hover:bg-red-600",
    };
    return (
      <Badge className={`${statusColors[status]} text-white capitalize`}>
        {status}
      </Badge>
    );
  };

  const sortByDate = (a, b) => b.createdAt?.seconds - a.createdAt?.seconds;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Tabs defaultValue="bookings">
        <TabsList className="grid w-full  grid-cols-3 bg-muted/50">
          <TabsTrigger
            value="bookings"
            className="py-2 px-4 rounded-full data-[state=active]:bg-secondary data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all"
          >
            Active
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="py-2 px-4 rounded-full data-[state=active]:bg-secondary data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all"
          >
            Completed
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="py-2 px-4 rounded-full data-[state=active]:bg-secondary data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all"
          >
            History
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
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      {/* Image and Vendor Information */}
                      <div className="flex items-center gap-4 w-full md:w-auto">
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
                          <div className="flex flex-col md:flex-row gap-2 text-sm">
                            <p className="text-blue-600 dark:text-blue-400">
                              Created on: {formatTimestamp(booking.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                              className="w-full md:w-auto rounded-[5px]"
                            >
                              Cancel
                            </Button>
                          </DialogTrigger>

                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cancel Booking</DialogTitle>
                            </DialogHeader>
                            <DialogDescription className="text-sm ">
                              Enter reason for cancellation
                            </DialogDescription>
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
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* Star Rating Popup with Review Field */}
        <Dialog open={showRatingPopup} onOpenChange={setShowRatingPopup}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate the Vendor</DialogTitle>
              <DialogDescription>
                How would you rate your experience with{" "}
                {bookingToRate?.vendorName}?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center gap-2 my-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    star <= rating ? "text-yellow-500" : "text-gray-300"
                  }`}
                >
                  <Star className="w-8 h-8" />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Write your review..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="mt-4"
            />
            <Button onClick={handleRatingSubmit} className="w-full mt-4">
              Submit Rating and Review
            </Button>
          </DialogContent>
        </Dialog>

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
                            <h3 className="font-semibold md:text-lg">
                              {booking.vendorName}
                            </h3>
                            {getStatusBadge(booking.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {booking.vendorService}
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            Completed on: {formatTimestamp(booking.completedAt)}
                          </p>
                          {booking.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-5 w-5 ${
                                    star <= booking.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300 dark:text-gray-500"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                          {booking.review && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                              Review: {booking.review}
                            </p>
                          )}
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
                              <h3 className="font-semibold md:text-lg">
                                {booking.vendorName}
                              </h3>
                              {getStatusBadge(booking.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {booking.vendorService}
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              Created on: {formatTimestamp(booking.createdAt)}
                            </p>
                            {booking.cancelledAt && (
                              <p className="text-sm text-red-600 dark:text-red-400">
                                Cancelled on:{" "}
                                {formatTimestamp(booking.cancelledAt)}
                              </p>
                            )}
                            {booking.completedAt && (
                              <p className="text-sm text-green-600 dark:text-green-400">
                                Completed on:{" "}
                                {formatTimestamp(booking.completedAt)}
                              </p>
                            )}
                            {booking.rating && (
                              <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-5 w-5 ${
                                      star <= booking.rating
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300 dark:text-gray-500"
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                            {booking.review && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                                Review: {booking.review}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Booking;
