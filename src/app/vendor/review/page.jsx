"use client";

import React, { useEffect, useState } from "react";
import { auth, firestore } from "@/context/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { formatTimestamp } from "@/lib/formatTime";
import { Star, User } from "lucide-react";
import Loading from "@/app/loading";
import Image from "next/image";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const VendorReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  const fetchReviews = async (userId) => {
    try {
      const bookingsQuery = query(
        collection(firestore, "bookings"),
        where("vendorId", "==", userId),
        where("status", "==", "completed"),
        orderBy("ratedAt", "desc")
      );

      const snapshot = await getDocs(bookingsQuery);
      const reviewsPromises = snapshot.docs.map(async (bookingDoc) => {
        const booking = bookingDoc.data();
        const customerId = booking.userId;

        let customerName = "Unknown";
        let profileImage = "";

        if (customerId) {
          const customerRef = doc(firestore, "users", customerId);
          const customerDoc = await getDoc(customerRef);
          if (customerDoc.exists()) {
            const customerData = customerDoc.data();
            customerName = `${customerData.firstName || ""} ${
              customerData.lastName || ""
            }`.trim();
            profileImage = customerData.profileImage || "";
          }
        }

        return {
          id: bookingDoc.id,
          customerName,
          profileImage,
          rating: booking.rating,
          comment: booking.review,
          timestamp: formatTimestamp(booking.ratedAt),
        };
      });

      const reviewsData = await Promise.all(reviewsPromises);
      setReviews(reviewsData);

      // Calculate average rating
      const totalRating = reviewsData.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const avgRating =
        reviewsData.length > 0
          ? (totalRating / reviewsData.length).toFixed(1)
          : 0;
      setAverageRating(avgRating);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchReviews(user.uid);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <ProtectedRoute roleRequired={"vendor"}>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              ⭐ Reviews & Ratings
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-2">
              See what your customers are saying about you.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Average Rating */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-xl md:text-2xl font-semibold">
              Average Rating: {averageRating}/5
            </CardTitle>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 ${
                    star <= averageRating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300 dark:text-gray-500"
                  }`}
                />
              ))}
            </div>
          </CardHeader>
        </Card>

        {/* Reviews List */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[80%] mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <Card key={review.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    {/* User Info and Rating */}
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={review.profileImage} alt={review.customerName} />
                        <AvatarFallback>
                          <User className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-lg">{review.customerName}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= review.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300 dark:text-gray-500"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Review Date */}
                  </div>
                </CardHeader>
                <CardContent>
                    <p variant="outline" className="py-2 text-sm">
                      Reviewed on {review.timestamp}
                    </p>
                  <p className="text-muted-foreground">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">No Reviews Yet</CardTitle>
              <CardDescription>
                Check back later for customer reviews!
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default VendorReviewsPage;