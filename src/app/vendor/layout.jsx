"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FiHome, FiBox, FiClock } from "react-icons/fi"
import { RiCustomerService2Line } from "react-icons/ri"
import { Star } from "react-feather"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { auth, firestore } from "@/context/Firebase"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore"
import Image from "next/image"
import { ModeToggle } from "@/components/ToggleTheme"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import ProfileMenu from "@/components/ProfileMenu"
import Loading from "@/app/loading"

const VendorLayout = ({ children }) => {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const fetchData = async () => {
      const currentUser = auth.currentUser
      if (!currentUser) return

      try {
        const userDoc = await getDoc(doc(firestore, "users", currentUser.uid))
        if (userDoc.exists()) setUser(userDoc.data())

        const bookingsQuery = query(
          collection(firestore, "bookings"),
          where("vendorId", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(3)
        )
        const bookingsSnapshot = await getDocs(bookingsQuery)
        const activities = bookingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        }))
        setRecentActivities(activities)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    auth.onAuthStateChanged((user) => {
      if (user) fetchData()
      else router.push("/login")
    })
  }, [router])

  const mainNav = [
    {
      name: "Dashboard",
      icon: <FiHome className="w-5 h-5" />,
      path: "/vendor",
    },
    {
      name: "Bookings",
      icon: <FiBox className="w-5 h-5" />,
      path: "/vendor/bookings",
    },
    {
      name: "Reviews & Rating",
      icon: <Star className="w-5 h-5" />,
      path: "/vendor/review",
    },
    {
      name: "Support",
      icon: <RiCustomerService2Line className="w-5 h-5" />,
      path: "/vendor/support",
    },
  ]

  if (loading || !isClient) return <Loading />

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b lg:hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center"
            >
              <Image
                src="/logo.svg"
                alt="logo"
                width={40}
                height={40}
                className="h-4 w-auto"
                priority
              />
            </motion.div>

            <div className="flex items-center gap-3">
              {user ? (
                <ProfileMenu mobile />
              ) : (
                <Button
                  asChild
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  <Link href="/login">Get Started</Link>
                </Button>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-foreground/80"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden space-y-2 pb-4"
              >
                {mainNav.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      pathname === link.path
                        ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-primary"
                        : "hover:bg-accent/50"
                    )}
                  >
                    {link.icon}
                    <span className="font-medium">{link.name}</span>
                  </Link>
                ))}
                <ModeToggle />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Desktop Layout */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r p-4 fixed h-screen bg-background/80 backdrop-blur-lg overflow-y-auto md:flex flex-col space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-8"
          >
            <Link href="/vendor" className="flex items-center mt-5">
              <Image
                src="/logo.svg"
                width={100}
                height={40}
                alt="Vendor Dashboard"
                className="h-6 mx-auto w-auto"
              />
            </Link>

            <nav className="space-y-1">
              {mainNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    pathname === item.path
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                      : "hover:bg-accent/50 text-foreground/80 hover:text-foreground"
                  )}
                >
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Recent Activities */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground/80 px-2">
                Recent Activities
              </h2>
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Card className="p-3 text-sm bg-background hover:bg-accent/30 transition-colors group"> 
                      <div className="flex flex-col gap-3 items-center justify-between">
                        <div className="flex justify-center items-center gap-2">
                          <p className="text-sm line-clamp-1 text-primary  mb-1 group-hover:text-indigo-600">
                            {activity.userName}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              activity.status === "completed"
                                ? "bg-green-500/20 text-green-600"
                                : activity.status === "booked"
                                ? "bg-blue-500/20 text-blue-600"
                                : "bg-red-500/20 text-red-600"
                            }`}
                          >
                            {activity.status}
                          </span>
                        </div>
                        <div className="text-muted-foreground text-xs flex items-center gap-3">
                          <p className="flex items-center gap-1">
                            {" "}
                            <FiClock className="w-3 h-3 " />
                            {activity.createdAt?.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                          {/* Format: DD-MM-YYYY */}
                          <p>
                            {activity.createdAt?.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center items-start gap-y-3">
              <ProfileMenu />
              <ModeToggle />
            </div>
          </motion.div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:p-4 lg:ml-64">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto bg-background rounded-xl p-1 md:p-4 shadow-sm"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default VendorLayout
