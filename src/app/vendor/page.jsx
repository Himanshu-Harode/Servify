"use client"
import { useEffect, useState } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { auth, firestore } from "@/context/Firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import Loading from "../loading"
import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const VendorPage = () => {
  const [loading, setLoading] = useState(true)
  const [vendorData, setVendorData] = useState({
    serviceName: "Loading...",
    vendorName: "Vendor",
    averageRating: 0,
    totalBookings: 0,
    successfulBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
  })
  const [bookingData, setBookingData] = useState([])
  const [error, setError] = useState(null)
  const { theme } = useTheme()

  // State for filters
  const [statusFilter, setStatusFilter] = useState("all") // all, completed, cancelled, pending
  const [timelineFilter, setTimelineFilter] = useState("all") // all, 1week, 1month, 1year

  const fetchData = async (user) => {
    try {
      const userDocRef = doc(firestore, "users", user.uid)
      const userDocSnap = await getDoc(userDocRef)
      if (!userDocSnap.exists()) throw new Error("Vendor profile not found")

      const userData = userDocSnap.data()
      const bookingsQuery = query(
        collection(firestore, "bookings"),
        where("vendorId", "==", user.uid)
      )
      const querySnapshot = await getDocs(bookingsQuery)

      let successCount = 0
      let pendingCount = 0
      let cancelledCount = 0
      const bookings = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        bookings.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
        })

        if (data.status === "completed") successCount++
        if (data.status === "booked") pendingCount++
        if (data.status === "cancelled") cancelledCount++
      })

      setVendorData({
        serviceName: userData.service || "No Service",
        vendorName: userData.name || "Vendor",
        averageRating: userData.averageRating || 0,
        totalBookings: bookings.length,
        successfulBookings: successCount,
        pendingBookings: pendingCount,
        cancelledBookings: cancelledCount,
      })

      setBookingData(bookings)
      setError(null)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) await fetchData(user)
      else setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Filter booking data based on status and timeline
  const filteredBookings = bookingData.filter((booking) => {
    const now = new Date()
    const bookingDate = new Date(booking.createdAt)

    // Filter by status
    if (statusFilter !== "all" && booking.status !== statusFilter) return false

    // Filter by timeline
    switch (timelineFilter) {
      case "1week":
        return now - bookingDate <= 7 * 24 * 60 * 60 * 1000 // Last 1 week
      case "1month":
        return now - bookingDate <= 30 * 24 * 60 * 60 * 1000 // Last 1 month
      case "1year":
        return now - bookingDate <= 365 * 24 * 60 * 60 * 1000 // Last 1 year
      default:
        return true // All data
    }
  })

  // Prepare chart data
  const chartData = filteredBookings
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((booking) => ({
      date: new Date(booking.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }), // Format: DD-MM-YYYY
      total: 1,
      successful: booking.status === "completed" ? 1 : 0,
      cancelled: booking.status === "cancelled" ? 1 : 0,
      pending: booking.status === "booked" ? 1 : 0,
    }))

  if (loading) return <Loading />

  return (
    <ProtectedRoute roleRequired={["vendor"]}>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
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
        <Card className="md:p-6 bg-background rounded-xl shadow-lg mb-8">
          <h3 className="text-2xl font-bold mb-6">📊 Booking Analytics</h3>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full rounded-[2px] md:w-48 bg-background">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-background rounded-b-[5px]">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="booked">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timelineFilter} onValueChange={setTimelineFilter}>
              <SelectTrigger className="w-full rounded-[2px] md:w-48 bg-background">
                <SelectValue placeholder="Filter by timeline" />
              </SelectTrigger>
              <SelectContent className="bg-background rounded-b-[5px]">
                <SelectItem value="all">All Data</SelectItem>
                <SelectItem value="1week">Last 1 Week</SelectItem>
                <SelectItem value="1month">Last 1 Month</SelectItem>
                <SelectItem value="1year">Last 1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bar Chart */}
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={theme === "dark" ? "#555" : "#eee"}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: theme === "dark" ? "#fff" : "#000" }}
                  stroke={theme === "dark" ? "#fff" : "#000"}
                />
                <YAxis
                  tick={{ fill: theme === "dark" ? "#fff" : "#000" }}
                  stroke={theme === "dark" ? "#fff" : "#000"}
                  ticks={[0, 1]}
                  interval={0}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#333" : "#fff",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar
                  dataKey="successful"
                  name="Completed"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="cancelled"
                  name="Cancelled"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="pending"
                  name="Pending"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Service Overview */}
        <Card className="p-6 bg-background rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold mb-4">🏢 Service Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 text-center gap-4">
            <div className="p-4 bg-muted rounded-lg border-r-2">
              <h4 className="text-lg font-semibold mb-2">Service Details</h4>
              <p className="text-primary bg-primary/20 w-fit mx-auto px-4 rounded-xl text-xl font-medium">
                {vendorData.serviceName}
              </p>
              <p className="text-muted-foreground mt-2">
                Average Rating: {vendorData.averageRating}/5
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="text-lg font-semibold mb-2">Performance Metrics</h4>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-xl font-bold">
                    {(
                      (vendorData.successfulBookings / vendorData.totalBookings) *
                        100 || 0
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cancellation Rate</p>
                  <p className="text-xl font-bold">
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
  )
}

const MetricCard = ({ title, value, gradient }) => (
  <Card className={`p-4 bg-gradient-to-r ${gradient} text-white rounded-xl text-center shadow-lg`}>
    <h3 className="">{title}</h3>
    <p className="text-2xl  mt-2">{value}</p>
  </Card>
)

export default VendorPage