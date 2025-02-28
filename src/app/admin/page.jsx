"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { firestore } from "@/context/Firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Loading from "../loading";
import { Card } from "@/components/ui/card";

const AdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalVendors, setTotalVendors] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [successfulBookings, setSuccessfulBookings] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch total users
        const usersSnapshot = await getDocs(collection(firestore, "users"));
        let userCount = 0;
        let vendorCount = 0;
        let adminCount = 0;

        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.role === "user") userCount++;
          if (userData.role === "vendor") vendorCount++;
          if (userData.role === "admin") adminCount++;
        });

        setTotalUsers(userCount);
        setTotalVendors(vendorCount);
        setTotalAdmins(adminCount);

        // Fetch successful bookings
        const bookingsQuery = query(
          collection(firestore, "bookings"),
          where("status", "==", "completed")
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        setSuccessfulBookings(bookingsSnapshot.size);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <Loading />;

  return (
    <ProtectedRoute roleRequired={["admin"]}>
      <Header />
      <div className="p-6 max-w-6xl mx-auto">
        {/* Metrics Boxes */}
        <div className="grid grid-cols-2 text-center md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold">Total Users</h3>
            <p className="text-3xl font-bold">{totalUsers}</p>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold">Total Vendors</h3>
            <p className="text-3xl font-bold">{totalVendors}</p>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold">Total Admins</h3>
            <p className="text-3xl font-bold">{totalAdmins}</p>
          </Card>
          <Card className="p-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold">Successful Bookings</h3>
            <p className="text-3xl font-bold">{successfulBookings}</p>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPage;
