"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { auth, firestore } from "@/context/Firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Loading from "../loading";
import { Card } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useTheme } from "next-themes";

const VendorPage = () => {
  const [loading, setLoading] = useState(true);
  const [totalBookings, setTotalBookings] = useState(0);
  const [successfulBookings, setSuccessfulBookings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [serviceName, setServiceName] = useState("Loading...");
  const [bookingData, setBookingData] = useState([]);
  const { theme } = useTheme();

  // Fetch vendor data (service name & average rating)
  useEffect(() => {
    const fetchVendorData = async (user) => {
      if (!user) return;

      try {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setServiceName(userData.service || "No Service");
          setAverageRating(userData.averageRating ? userData.averageRating: 0);
        } else {
          setServiceName("No Service Found");
          setAverageRating(0);
        }
      } catch (error) {
        console.error("Error fetching vendor data:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await fetchVendorData(currentUser);
        await fetchBookings(currentUser); // Fetch bookings after user is available
      }
      setLoading(false); // Stop loading after fetching user data
    });

    return () => unsubscribe();
  }, []);

  // Fetch booking data from Firebase
  const fetchBookings = async (user) => {
    if (!user) return;

    try {
      const q = query(collection(firestore, "bookings"), where("vendorId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const bookings = [];
      let successCount = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push(data);
        if (data.status === "completed") successCount++;
      });

      setBookingData(bookings);
      setTotalBookings(bookings.length);
      setSuccessfulBookings(successCount);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  // Format booking data for the chart
  const chartData = bookingData.map((booking) => ({
    date: booking.createdAt ? new Date(booking.createdAt.toDate()).toLocaleDateString() : "Unknown",
    total: 1,
    successful: booking.status === "completed" ? 1 : 0,
  }));

  if (loading) return <Loading />;

  return (
    <ProtectedRoute roleRequired={["vendor"]}>
      <Header />
      <div className="p-6 max-w-6xl mx-auto">
        {/* Metrics Boxes */}
        <div className="grid grid-cols-2 text-center md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold">Total Bookings</h3>
            <p className="text-3xl font-bold">{totalBookings}</p>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold">Successful Bookings</h3>
            <p className="text-3xl font-bold">{successfulBookings}</p>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold">Average Rating</h3>
            <p className="text-3xl font-bold">{averageRating}</p>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold">Service Name</h3>
            <p className="text-3xl font-bold">{serviceName}</p>
          </Card>
        </div>

        {/* Chart */}
        <Card className="p-6 bg-background rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-6">📈 Bookings Over Time</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#555" : "#eee"} />
              <XAxis
                dataKey="date"
                tick={{ fill: theme === "dark" ? "#fff" : "#000" }}
                stroke={theme === "dark" ? "#fff" : "#000"}
              />
              <YAxis
                tick={{ fill: theme === "dark" ? "#fff" : "#000" }}
                stroke={theme === "dark" ? "#fff" : "#000"}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "dark" ? "#333" : "#fff",
                  borderColor: theme === "dark" ? "#555" : "#ddd",
                  borderRadius: "8px",
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                  color: theme === "dark" ? "#fff" : "#000",
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#4CAF50"
                fill="rgba(76, 175, 80, 0.2)"
                name="Total Bookings"
              />
              <Area
                type="monotone"
                dataKey="successful"
                stroke="#FF9800"
                fill="rgba(255, 152, 0, 0.2)"
                name="Successful Bookings"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default VendorPage;