"use client";

import { useEffect, useState } from "react";
import { auth, firestore } from "@/context/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Star, User } from "lucide-react";
import Loading from "@/app/loading"; // Updated Loading component
import Image from "next/image";

const VendorReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch reviews and ratings from Firestore
  useEffect(() => {
    const fetchReviewsAndRating = async (vendorId) => {
      try {
        // Fetch average rating from the users collection
        const vendorRef = doc(firestore, "users", vendorId);
        const vendorDoc = await getDoc(vendorRef);
        if (vendorDoc.exists()) {
          const vendorData = vendorDoc.data();
          setAverageRating(vendorData.averageRating || 0);
        }

        // Fetch reviews from the bookings collection
        const bookingsQuery = query(
          collection(firestore, "bookings"),
          where("vendorId", "==", vendorId),
          where("status", "==", "completed"), // Only fetch completed bookings
          orderBy("completedAt", "desc") // Sort by completedAt in descending order
        );
        const querySnapshot = await getDocs(bookingsQuery);

        const reviewsData = await Promise.all(querySnapshot.docs.map(async (bookingDoc) => {
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
            timestamp: booking.completedAt?.toDate().toLocaleDateString(), // Use completedAt for the timestamp
          };
        }));

        setReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching reviews and rating:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchReviewsAndRating(user.uid);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ⭐ Reviews & Ratings
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          See what your customers are saying about you.
        </p>
      </div>

      {/* Average Rating Section */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl text-center shadow-lg">
        <h2 className="text-5xl font-bold text-gray-900 dark:text-gray-100">{averageRating}/5</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Average Rating</p>
        <div className="flex justify-center mt-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-6 w-6 ${
                star <= Math.round(averageRating)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300 dark:text-gray-500"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <Card
            key={review.id}
            className="p-6 hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white dark:bg-background/40 rounded-[5px]"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              {/* User Info and Rating */}
              <div className="flex items-center  gap-4">
                {review.profileImage ? (
                  <img
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reviewed on {review.timestamp}
              </p>
            </div>

            {/* Review Comment */}
            <p className="mt-4 text-gray-700 dark:text-gray-300">{review.comment}</p>
          </Card>
        ))}
      </div>

      {/* No Reviews Message */}
      {reviews.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No reviews yet. Check back later!</p>
        </div>
      )}
    </div>
  );
};

export default VendorReviewsPage;