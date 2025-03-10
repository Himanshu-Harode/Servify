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
            customerName = `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim();
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
      const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = reviewsData.length > 0 ? (totalRating / reviewsData.length).toFixed(1) : 0;
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
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ⭐ Reviews & Ratings
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          See what your customers are saying about you.
        </p>
      </div>

      {/* Average Rating */}
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Average Rating: {averageRating}/5
        </h2>
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
      </div>

      {/* Reviews List */}
      {loading ? (
        <Loading />
      ) : reviews.length > 0 ? (
        <div className="grid grid-cols-1   gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 border-2 bg-white dark:bg-gray-800 rounded-[5px] shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                {/* User Info and Rating */}
                <div className="flex items-center gap-4">
                  {review.profileImage ? (
                    <Image
                    height={100}
                    width={100}
                      src={review.profileImage}
                      alt={review.customerName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      {review.customerName}
                    </p>
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
                <p className=" text-gray-600 dark:text-gray-400">
                  Reviewed on {review.timestamp}
                </p>
              </div>

              {/* Review Comment */}
              <p className="mt-4 text-gray-700 dark:text-gray-300">{review.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No reviews yet. Check back later!</p>
        </div>
      )}
    </div>
  );
};

export default VendorReviewsPage;