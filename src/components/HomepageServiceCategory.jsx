"use client"
import { useEffect, useState } from "react"
import { firestore } from "@/context/Firebase"
import { collection, getDocs, query, orderBy, where } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Plus, ArrowRight, ArrowLeft, Star, MapPin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"

const HomepageServiceCategory = () => {
  const [services, setServices] = useState([])
  const [vendors, setVendors] = useState([])
  const [filteredVendors, setFilteredVendors] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentVendorPage, setCurrentVendorPage] = useState(1)
  const vendorsPerPage = 8

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesQuery = query(
          collection(firestore, "service"),
          orderBy("id", "asc")
        )
        const querySnapshot = await getDocs(servicesQuery)
        const servicesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setServices(servicesData)
      } catch (error) {
        console.error("Error fetching services:", error)
      }
    }

    fetchServices()
  }, [])

  // Fetch vendors with average ratings
  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true)
      try {
        const querySnapshot = await getDocs(collection(firestore, "users"))
        const vendorsData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((vendor) => vendor.role === "vendor")

        // Fetch average ratings for each vendor
        const vendorsWithRatings = await Promise.all(
          vendorsData.map(async (vendor) => {
            const bookingsQuery = query(
              collection(firestore, "bookings"),
              where("vendorId", "==", vendor.id)
            )
            const bookingsSnapshot = await getDocs(bookingsQuery)
            const bookings = bookingsSnapshot.docs.map((doc) => doc.data())

            // Calculate average rating
            const totalRatings = bookings.filter((b) => b.rating).length
            const ratingSum = bookings.reduce((sum, b) => sum + (b.rating || 0), 0)
            const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0

            return {
              ...vendor,
              // averageRating: parseFloat(averageRating.toFixed(1)), // Round to 1 decimal place
            }
          })
        )

        setVendors(vendorsWithRatings)
        setFilteredVendors(vendorsWithRatings)
      } catch (error) {
        console.error("Error fetching vendors:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [])

  // Filter vendors based on selected service
  const handleServiceClick = (serviceName) => {
    if (selectedService === serviceName) {
      setSelectedService(null)
      setFilteredVendors(vendors)
    } else {
      setSelectedService(serviceName)
      setLoading(true)
      setTimeout(() => {
        setFilteredVendors(
          vendors.filter((vendor) => vendor.service === serviceName)
        )
        setCurrentVendorPage(1)
        setLoading(false)
      }, 500)
    }
  }

  // Handle page change with loader
  const handlePageChange = (newPage) => {
    setLoading(true)
    setTimeout(() => {
      setCurrentVendorPage(newPage)
      setLoading(false)
    }, 500)
  }

  // Pagination logic
  const totalVendorPages = Math.ceil(filteredVendors.length / vendorsPerPage)
  const paginatedVendors = filteredVendors.slice(
    (currentVendorPage - 1) * vendorsPerPage,
    currentVendorPage * vendorsPerPage
  )

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  }

  const stagger = {
    visible: { transition: { staggerChildren: 0.1 } },
  }

  const cardAnimation = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
  }

  return (
    <section className="pb-24 pt-5 px-4 sm:px-6 lg:px-20 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Service Categories */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
              Explore{" "}
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Services
              </span>
            </h2>
          </div>

          {/* Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {services.slice(0, 5).map((service) => (
              <motion.button
                key={service.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleServiceClick(service.name)}
                className={`p-5 rounded-2xl backdrop-blur-lg border transition-all duration-300 flex flex-col items-center space-y-3 shadow-lg ${
                  selectedService === service.name
                    ? "bg-gradient-to-br from-blue-500/90 to-purple-600/90 border-transparent text-white"
                    : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                }`}
              >
                <div className="p-3 rounded-2xl bg-blue-100/50 dark:bg-blue-900/30">
                  <Image
                    src={service.image}
                    alt={service.name}
                    width={48}
                    height={48}
                    className="object-contain "
                    priority
                  />
                </div>
                <span className="text-lg font-bold">{service.name}</span>
              </motion.button>
            ))}

            {/* Discover More Card */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-5 flex flex-col items-center justify-center rounded-2xl backdrop-blur-lg border transition-all duration-300 shadow-lg bg-gradient-to-br 
          dark:from-blue-500/90 dark:to-purple-600/90 dark:text-white"
            >
              <Link
                href="/category"
                className="flex flex-col items-center space-y-2"
              >
                <ArrowRight className="w-10 h-10" />
                <span className="text-lg font-bold line-clamp-1">Categories</span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Vendor Section */}
        <div className="space-y-10">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            {selectedService
              ? `Top ${selectedService} Experts`
              : "Featured Professionals"}
          </h2>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={fadeIn}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden"
                  >
                    <Skeleton className="h-60 w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800" />
                    <div className="p-5 space-y-4">
                      <Skeleton className="h-5 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={stagger}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <AnimatePresence>
                  {paginatedVendors.map((vendor) => (
                    <motion.div
                      key={vendor.id}
                      variants={cardAnimation}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      whileHover={{ y: -8 }}
                      className="group relative h-[300px] rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      <Link
                        href={`/search/${vendor.id}`}
                        className="absolute inset-0 w-full h-full"
                      >
                        {/* Image Container */}
                        <div className="relative w-full h-full">
                          <Image
                            src={
                              vendor?.profileImage || "/placeholder-user.png"
                            }
                            alt={vendor.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transform group-hover:scale-105 transition-transform duration-300"
                            priority
                          />

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent" />

                          {/* Content Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            {/* Top Badges */}
                            <div className="flex justify-between items-start mb-4">
                              <span className="bg-blue-500/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold">
                                {vendor.service}
                              </span>
                              <div className="flex items-center justify-center bg-gray-900/80 backdrop-blur-sm px-3 py-1 rounded-full">
                                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                <span className="text-sm font-semibold">
                                  {vendor.averageRating || 0}
                                </span>
                              </div>
                            </div>

                            {/* Main Content */}
                            <div className="space-y-3">
                              <h3 className="text-2xl font-bold truncate">
                                {vendor.organizationName}
                              </h3>
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center text-sm opacity-90 font-medium">
                                  <MapPin className="w-4 h-4 mr-1.5" />
                                  <span className="truncate">
                                    {vendor.city || "N/A"}
                                  </span>
                                </div>

                                <span className="bg-white/10 text-xs backdrop-blur-sm px-3 py-1 rounded-full">
                                  🕑 {vendor.availableTime || "Flexible"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalVendorPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-4 mt-12"
            >
              <Button
                onClick={() => handlePageChange(currentVendorPage - 1)}
                disabled={currentVendorPage === 1 || loading}
                variant="outline"
                className="rounded-full px-6 gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                Page {currentVendorPage} of {totalVendorPages}
              </div>

              <Button
                onClick={() => handlePageChange(currentVendorPage + 1)}
                disabled={currentVendorPage === totalVendorPages || loading}
                variant="outline"
                className="rounded-full px-6 gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}

export default HomepageServiceCategory