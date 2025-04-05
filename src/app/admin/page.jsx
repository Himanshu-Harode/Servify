"use client"
import { useEffect, useState } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { auth, firestore } from "@/context/Firebase"
import { collection, query, onSnapshot } from "firebase/firestore"
import { Bar, Pie } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js"
import { Card, MetricCard } from "@/components/cards"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { FiAlertTriangle, FiRefreshCw, FiUsers, FiShoppingBag, FiActivity } from "react-icons/fi"
import { Skeleton } from "@/components/ui/skeleton"
import { onAuthStateChanged } from "firebase/auth"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const AdminPage = () => {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        onlineUsers: 0,
        onlineVendors: 0,
        totalUsers: 0,
        totalVendors: 0,
        activeUsers: 0,
        activeVendors: 0,
        totalBookings: 0,
        completedBookings: 0,
        successRate: 0
    })
    const [error, setError] = useState(null)
    const [users, setUsers] = useState([])
    const [bookings, setBookings] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("createdAt-desc")

    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) setLoading(false)
        })

        const usersListener = onSnapshot(collection(firestore, "users"),
            (snapshot) => {
                const counts = {
                    onlineUsers: 0,
                    onlineVendors: 0,
                    totalUsers: 0,
                    totalVendors: 0,
                    activeUsers: 0,
                    activeVendors: 0
                }

                const userList = []
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

                snapshot.forEach((doc) => {
                    const data = doc.data()
                    const lastActive = data.lastActive?.toDate()
                    const createdAt = data.createdAt?.toDate()
                    const isActive = lastActive > thirtyDaysAgo

                    userList.push({
                        id: doc.id,
                        ...data,
                        lastActive,
                        createdAt,
                        status: data.isOnline ? 'online' : 'offline'
                    })

                    if (data.role === "user") {
                        counts.totalUsers++
                        if (isActive) counts.activeUsers++
                        if (data.isOnline) counts.onlineUsers++
                    }
                    if (data.role === "vendor") {
                        counts.totalVendors++
                        if (isActive) counts.activeVendors++
                        if (data.isOnline) counts.onlineVendors++
                    }
                })

                setStats(prev => ({ ...prev, ...counts }))
                setUsers(userList)
                setLoading(false)
            },
            (error) => {
                setError("Failed to load real-time data")
                console.error("Listener error:", error)
            }
        )

        const bookingsListener = onSnapshot(collection(firestore, "bookings"),
            (snapshot) => {
                const bookingList = []
                let completedCount = 0
                let totalCount = 0

                snapshot.forEach(doc => {
                    const data = doc.data()
                    totalCount++
                    if (data.status === 'completed') completedCount++
                    bookingList.push({
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate()
                    })
                })

                setStats(prev => ({
                    ...prev,
                    totalBookings: totalCount,
                    completedBookings: completedCount,
                    successRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
                }))
                setBookings(bookingList)
            }
        )

        return () => {
            authUnsubscribe()
            usersListener()
            bookingsListener()
        }
    }, [])

    // Filter and sort users
    const filteredUsers = users
        .filter(user =>
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case "email-asc":
                    return a.email.localeCompare(b.email)
                case "email-desc":
                    return b.email.localeCompare(a.email)
                case "createdAt-asc":
                    return a.createdAt - b.createdAt
                case "createdAt-desc":
                    return b.createdAt - a.createdAt
                default:
                    return 0
            }
        })

    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

    const chartData = {
        labels: ['Users', 'Vendors'],
        datasets: [
            {
                label: 'Online Count',
                data: [stats.onlineUsers, stats.onlineVendors],
                backgroundColor: ['#3B82F6', '#8B5CF6'],
            },
            {
                label: 'Total Count',
                data: [stats.totalUsers, stats.totalVendors],
                backgroundColor: ['#60A5FA', '#A78BFA'],
            }
        ]
    }

    if (loading) return (
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800" />
            ))}
        </div>
    )

    return (
        <ProtectedRoute roleRequired={["admin"]}>
            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                {error && (
                    <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 rounded-lg flex items-center gap-3 animate-fade-in">
                        <FiAlertTriangle className="flex-shrink-0" />
                        {error}
                        <Button variant="ghost" onClick={() => window.location.reload()}>
                            <FiRefreshCw className="mr-2" /> Retry
                        </Button>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <MetricCard
                        title="Live Users"
                        value={stats.onlineUsers}
                        total={stats.totalUsers}
                        icon={<FiUsers className="w-6 h-6" />}
                        color="bg-blue-500 text-white"
                    />
                    <MetricCard
                        title="Live Vendors"
                        value={stats.onlineVendors}
                        total={stats.totalVendors}
                        icon={<FiShoppingBag className="w-6 h-6" />}
                        color="bg-purple-500 text-white"
                    />
                    <MetricCard
                        title="Completed Bookings"
                        value={stats.completedBookings}
                        total={stats.totalBookings}
                        icon={<FiActivity className="w-6 h-6" />}
                        color="bg-green-500 text-white"
                    />
                    <MetricCard
                        title="Booking Success"
                        value={`${stats.successRate}%`}
                        icon={<FiActivity className="w-6 h-6" />}
                        color="bg-teal-500 text-white"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Card className="p-6">
                        <h3 className="text-xl font-semibold mb-4">User Distribution</h3>
                        <div className="h-64">
                            <Bar
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'top' } }
                                }}
                            />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Booking Status</h3>
                        <div className="h-64">
                            <Pie
                                data={{
                                    labels: ['Completed', 'Pending', 'Cancelled'],
                                    datasets: [{
                                        data: [
                                            bookings.filter(b => b.status === 'completed').length,
                                            bookings.filter(b => b.status === 'pending').length,
                                            bookings.filter(b => b.status === 'cancelled').length
                                        ],
                                        backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'right' } }
                                }}
                            />
                        </div>
                    </Card>
                </div>

                {/* Recent Users with Search and Sort */}
                <Card className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        <h3 className="text-xl font-semibold">Recent Users</h3>
                        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                            <Input
                                placeholder="Search by email..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="w-full sm:w-60"
                            />
                            <Select
                                value={sortBy}
                                onValueChange={(value) => {
                                    setSortBy(value)
                                    setCurrentPage(1)
                                }}
                            >
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent className="bg-background">
                                    <SelectGroup>
                                        <SelectLabel>Sort Options</SelectLabel>
                                        <SelectItem value="email-asc">Email A-Z</SelectItem>
                                        <SelectItem value="email-desc">Email Z-A</SelectItem>
                                        <SelectItem value="createdAt-desc">Newest First</SelectItem>
                                        <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="text-left border-b">
                                <th className="pb-3">Sr</th>
                                <th className="pb-3">Email</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3">Last Active</th>
                                <th className="pb-3">Role</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentUsers.map((user, index) => {
                                const startingIndex = (currentPage - 1) * itemsPerPage
                                return (
                                    <tr key={user.id} className="border-b last:border-b-0">
                                        <td className="py-3">{startingIndex + index + 1}</td>
                                        <td className="py-3">{user.email}</td>
                                        <td className="py-3">
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 
                                    ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}
                                />
                                            {user.status}
                                        </td>
                                        <td className="py-3">
                                            {user.lastActive?.toLocaleDateString()}
                                        </td>
                                        <td className="py-3 capitalize">{user.role}</td>
                                    </tr>
                                )
                            })}

                            {currentUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-4 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                <FaArrowLeft />
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                <FaArrowRight />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </ProtectedRoute>
    )
}

export default AdminPage
