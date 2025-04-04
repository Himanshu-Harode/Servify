"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { auth, firestore } from "@/context/Firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Loading from "../loading";
import { Card } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const VendorPage = () => {
  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState({
    serviceName: "Loading...",
    vendorName: "Vendor",
    averageRating: 0,
    totalBookings: 0,
    successfulBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
  });
  const [bookingData, setBookingData] = useState([]);
  const [error, setError] = useState(null);
  const { theme } = useTheme();

  // State for filters
  const [statusFilter, setStatusFilter] = useState("all"); // all, completed, cancelled, pending
  const [timelineFilter, setTimelineFilter] = useState("all"); // all, 1week, 1month, 1year

  const fetchData = async (user) => {
    try {
      const userDocRef = doc(firestore, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) throw new Error("Vendor profile not found");

      const userData = userDocSnap.data();
      const bookingsQuery = query(
        collection(firestore, "bookings"),
        where("vendorId", "==", user.uid)
      );
      const querySnapshot = await getDocs(bookingsQuery);

      let successCount = 0;
      let pendingCount = 0;
      let cancelledCount = 0;
      const bookings = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
        });

        if (data.status === "completed") successCount++;
        if (data.status === "booked") pendingCount++;
        if (data.status === "cancelled") cancelledCount++;
      });

      setVendorData({
        serviceName: userData.service || "No Service",
        vendorName: userData.name || "Vendor",
        averageRating: userData.averageRating || 0,
        totalBookings: bookings.length,
        successfulBookings: successCount,
        pendingBookings: pendingCount,
        cancelledBookings: cancelledCount,
      });

      setBookingData(bookings);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) await fetchData(user);
      else setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter booking data based on status and timeline
  const filteredBookings = bookingData.filter((booking) => {
    const now = new Date();
    const bookingDate = new Date(booking.createdAt);

    // Filter by status
    if (statusFilter !== "all" && booking.status !== statusFilter) return false;

    // Filter by timeline
    switch (timelineFilter) {
      case "1week":
        return now - bookingDate <= 7 * 24 * 60 * 60 * 1000; // Last 1 week
      case "1month":
        return now - bookingDate <= 30 * 24 * 60 * 60 * 1000; // Last 1 month
      case "1year":
        return now - bookingDate <= 365 * 24 * 60 * 60 * 1000; // Last 1 year
      default:
        return true; // All data
    }
  });

  // Prepare chart data
  const chartData = filteredBookings
    .reduce((acc, booking) => {
      const date = new Date(booking.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }); // Format: DD-MM-YYYY

      // Find or create an entry for the date
      const existingEntry = acc.find((entry) => entry.date === date);
      if (existingEntry) {
        existingEntry.total += 1;
        if (booking.status === "completed") existingEntry.successful += 1;
        if (booking.status === "cancelled") existingEntry.cancelled += 1;
        if (booking.status === "booked") existingEntry.pending += 1;
      } else {
        acc.push({
          date,
          total: 1,
          successful: booking.status === "completed" ? 1 : 0,
          cancelled: booking.status === "cancelled" ? 1 : 0,
          pending: booking.status === "booked" ? 1 : 0,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => new Date(a.date.split("-").reverse().join("-")) - new Date(b.date.split("-").reverse().join("-"))); // Sort by date

  // Chart.js data configuration
  const data = {
    labels: chartData.map((entry) => entry.date),
    datasets: [
      {
        label: "Completed",
        data: chartData.map((entry) => entry.successful),
        backgroundColor: "#10b981", // Green
        stack: "Stack 0",
      },
      {
        label: "Cancelled",
        data: chartData.map((entry) => entry.cancelled),
        backgroundColor: "#ef4444", // Red
        stack: "Stack 0",
      },
      {
        label: "Pending",
        data: chartData.map((entry) => entry.pending),
        backgroundColor: "#f59e0b", // Yellow
        stack: "Stack 0",
      },
    ],
  };

  // Chart.js options configuration
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Ensure chart fits container
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        ticks: {
          stepSize: 1,
        },
        grid: {
          color: theme === "dark" ? "#374151" : "#e5e7eb",
        },
      },
    },
  };

  if (loading) return <Loading />;

  return (
    <ProtectedRoute roleRequired={["vendor"]}>
      <div className="p-4 md:p-6 max-w-6xl mx-auto overflow-x-hidden">
        {/* Personalized Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            Hello, <span className="text-primary">{vendorData.vendorName}</span> 👋
          </h1>
          <p className="text-muted-foreground">Here's your dashboard overview.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-3">
            <FiAlertTriangle className="flex-shrink-0" />
            {error}
            <Button variant="ghost" onClick={() => window.location.reload()}>
              <FiRefreshCw className="mr-2" /> Retry
            </Button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <MetricCard
            title="Total Bookings"
            value={vendorData.totalBookings}
            gradient="from-blue-500 to-indigo-500"
          />
          <MetricCard
            title="Completed"
            value={vendorData.successfulBookings}
            gradient="from-green-500 to-teal-500"
          />
          <MetricCard
            title="Pending"
            value={vendorData.pendingBookings}
            gradient="from-yellow-500 to-amber-500"
          />
          <MetricCard
            title="Cancelled"
            value={vendorData.cancelledBookings}
            gradient="from-red-500 to-pink-500"
          />
          <MetricCard
            title="Avg. Rating"
            value={vendorData.averageRating}
            gradient="from-purple-500 to-pink-500"
          />
        </div>

        {/* Booking Analytics */}
        <Card className="p-4 md:p-6 bg-background rounded-xl shadow-lg mb-8">
          <h3 className="text-2xl font-bold mb-6">📊 Booking Analytics</h3>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-background">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="booked">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timelineFilter} onValueChange={setTimelineFilter}>
              <SelectTrigger className="w-full md:w-48 bg-background">
                <SelectValue placeholder="Filter by timeline" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All Data</SelectItem>
                <SelectItem value="1week">Last 1 Week</SelectItem>
                <SelectItem value="1month">Last 1 Month</SelectItem>
                <SelectItem value="1year">Last 1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bar Chart */}
          <div className="h-64 md:h-80 w-full">
            <Bar data={data} options={options} />
          </div>
        </Card>

      {/* Service Overview - Redesigned Section */}
<Card className="p-4 md:p-6 bg-background rounded-[5px] shadow-lg">
  <h3 className="text-2xl font-bold mb-6">🏢 Service Overview</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Service Details Card */}
    <div className="p-6 bg-gradient-to-r from-blue-400 to-indigo-500 dark:from-blue-600 dark:to-indigo-700 rounded-[5px] text-white">
      <h4 className="text-lg font-semibold mb-4">Service Details</h4>
      <div className="space-y-4">
        <div className="bg-white/10 dark:bg-black/10 p-4 rounded-[5px]">
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Service Name</p>
          <p className="text-xl font-medium">
            {vendorData.serviceName}
          </p>
        </div>
        <div className="bg-white/10 dark:bg-black/10 p-4 rounded-[5px]">
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Average Rating</p>
          <p className="text-xl font-medium">
            {vendorData.averageRating}/5
          </p>
        </div>
      </div>
    </div>

    {/* Performance Metrics Card */}
    <div className="p-6 bg-gradient-to-r from-green-400 to-teal-500 dark:from-green-600 dark:to-teal-700 rounded-[5px] text-white">
      <h4 className="text-lg font-semibold mb-4">Performance Metrics</h4>
      <div className="space-y-4">
        <div className="bg-white/10 dark:bg-black/10 p-4 rounded-[5px]">
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Completion Rate</p>
          <p className="text-xl font-medium">
            {(
              (vendorData.successfulBookings / vendorData.totalBookings) *
              100 || 0
            ).toFixed(1)}
            %
          </p>
        </div>
        <div className="bg-white/10 dark:bg-black/10 p-4 rounded-[5px]">
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Cancellation Rate</p>
          <p className="text-xl font-medium">
            {(
              (vendorData.cancelledBookings / vendorData.totalBookings) *
              100 || 0
            ).toFixed(1)}
            %
          </p>
        </div>
      </div>
    </div>
  </div>
</Card>
      </div>
    </ProtectedRoute>
  );
};

const MetricCard = ({ title, value, gradient }) => (
  <Card className={`p-4 bg-gradient-to-r ${gradient} text-white rounded-xl text-center shadow-lg transition-transform hover:scale-105`}>
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-2xl font-bold mt-2">{value}</p>
  </Card>
);

export default VendorPage;