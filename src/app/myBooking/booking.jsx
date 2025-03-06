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

const Booking = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(0); // State for star rating
  const [reviewText, setReviewText] = useState(""); // State for review text
  const [showRatingPopup, setShowRatingPopup] = useState(false); // State to show rating popup
  const [bookingToRate, setBookingToRate] = useState(null); // Booking to rate

  // Utility function to format timestamp as "day-date-year"
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate(); // Convert Firestore timestamp to JavaScript Date
    const options = { weekday: "long", day: "numeric", month: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options).replace(/\//g, "-");
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
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
          createdAt: doc.data().createdAt, // Keep as Firestore timestamp
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
          createdAt: doc.data().createdAt, // Keep as Firestore timestamp
          completedAt: doc.data().completedAt, // Keep as Firestore timestamp
          rating: doc.data().rating, // Keep the rating
          review: doc.data().review, // Keep the review
        }));
        setCompletedBookings(completed);
      });

      const allQ = query(
        collection(firestore, "bookings"),
        where("userId", "==", user.uid)
      );

      const unsubscribeAll = onSnapshot(allQ, (snapshot) => {
        const all = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt, // Keep as Firestore timestamp
          cancelledAt: doc.data().cancelledAt, // Keep as Firestore timestamp
          completedAt: doc.data().completedAt, // Keep as Firestore timestamp
          rating: doc.data().rating, // Keep the rating
          review: doc.data().review, // Keep the review
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
          cancelledAt: serverTimestamp(), // Add timestamp for cancellation
        }),
      });

      toast({
        title: "Booking Updated",
        description: `Booking has been ${newStatus}`,
        className: "bg-green-500 text-white",
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
      // Save the rating, review, and mark the booking as completed
      const bookingRef = doc(firestore, "bookings", bookingToRate.id);
      await updateDoc(bookingRef, {
        rating, // Save the rating
        review: reviewText, // Save the review
        ratedAt: serverTimestamp(), // Add timestamp for when the rating was submitted
        status: "completed", // Mark the booking as completed
        completedAt: serverTimestamp(), // Add timestamp for completion
      });

      // Update the vendor's average rating in the users collection
      const vendorRef = doc(firestore, "users", bookingToRate.vendorId);
      const vendorDoc = await getDoc(vendorRef);
      const vendorData = vendorDoc.data();

      // Calculate new average rating
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
        className: "bg-green-500 text-white",
      });

      // Close the popup and reset states
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

  // Sorting function
  const sortByDate = (a, b) => b.createdAt?.seconds - a.createdAt?.seconds;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Tabs defaultValue="bookings">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="bookings">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Bookings</TabsTrigger>
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
                            src={booking.vendorProfile || "/placeholder-user.png"}
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
                          {/* Display Booking Date and Time */}
                          <div className="flex flex-col md:flex-row gap-2 text-sm">
                            <p className="text-blue-600 dark:text-blue-400">
                              Created on: {formatTimestamp(booking.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
  
                      {/* Action Buttons */}
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
  
                        <Button
                          size="sm"
                          className="w-full md:w-auto rounded-[5px] bg-primary"
                          onClick={() => {
                            // Open the rating popup
                            setBookingToRate(booking);
                            setShowRatingPopup(true);
                          }}
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
  
        {/* Star Rating Popup with Review Field */}
        <Dialog open={showRatingPopup} onOpenChange={setShowRatingPopup}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate the Vendor</DialogTitle>
              <DialogDescription>
                How would you rate your experience with {bookingToRate?.vendorName}?
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
                            src={booking.vendorProfile || "/placeholder-user.png"}
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
                                Completed on: {formatTimestamp(booking.completedAt)}
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