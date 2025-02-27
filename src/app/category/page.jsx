"use client"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { firestore } from "@/context/Firebase"
import { collection, getDocs } from "firebase/firestore"
import Link from "next/link"
import Image from "next/image"
import Loading from "../loading"
import Header from "@/components/Header"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu, Star, MapPin, Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const CategoryPage = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedService = searchParams.get("service")
  const searchQuery = searchParams.get("search")

  const [services, setServices] = useState([])
  const [vendors, setVendors] = useState([])
  const [filteredVendors, setFilteredVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [localSearchQuery, setLocalSearchQuery] = useState("") // For the search bar in the CategoryPage

  // Fetch data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [serviceSnapshot, vendorSnapshot] = await Promise.all([
          getDocs(collection(firestore, "service")),
          getDocs(collection(firestore, "users")),
        ])

        const servicesData = serviceSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setServices(servicesData)

        let vendorsData = vendorSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((v) => v.role === "vendor")
        setVendors(vendorsData)

        // Filter vendors based on selected service and search query
        let filtered = vendorsData
        if (selectedService) {
          filtered = filtered.filter((v) => v.service === selectedService)
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(
            (v) =>
              v.name.toLowerCase().includes(query) ||
              v.service.toLowerCase().includes(query) ||
              v.city.toLowerCase().includes(query)
          )
        }
        setFilteredVendors(filtered)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedService, searchQuery])

  // Handle search from the CategoryPage search bar
  const handleLocalSearch = () => {
    const query = localSearchQuery.toLowerCase()
    const filtered = vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.service.toLowerCase().includes(query) ||
        v.city.toLowerCase().includes(query)
    )
    setFilteredVendors(filtered)
  }

  // Handle service click in the sidebar
  const handleServiceClick = (serviceName) => {
    router.push(
      serviceName === selectedService
        ? "/category"
        : `/category?service=${serviceName}`
    )
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex flex-col md:flex-row gap-6 my-6 mx-auto max-w-7xl px-4">
        {/* Sidebar */}
        <div className="hidden md:block w-64 p-4 border-2 rounded-xl bg-card h-full sticky top-20 shadow-sm dark:shadow-md dark:border-gray-700">
          <h2 className="text-xl font-bold text-primary mb-4">Service Categories</h2>
          <ul className="space-y-2">
            {services.map((service) => (
              <motion.li
                key={service.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => handleServiceClick(service.name)}
                  className={`block w-full text-left p-2 rounded-md font-medium border-2 hover:border-primary transition-colors duration-200 ${
                    selectedService === service.name
                      ? "bg-primary text-white"
                      : "bg-background hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {service.name}
                </button>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden " >
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger className="p-2 rounded-[5px] bg-primary text-white hover:bg-primary/90 transition-colors">
              <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="left" className="p-4 w-64 ">
              <SheetHeader>
                <SheetTitle className="text-xl font-bold text-primary">
                  Service Categories
                </SheetTitle>
              </SheetHeader>
              <ul className="space-y-2 mt-4">
                {services.map((service) => (
                  <motion.li
                    key={service.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={() => handleServiceClick(service.name)}
                      className={`block w-full text-left p-2 rounded-[5px] border hover:border-primary transition-colors duration-200 ${
                        selectedService === service.name
                          ? "bg-primary text-white"
                          : "bg-background hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {service.name}
                    </button>
                    <SheetDescription className="hidden">{service.id}</SheetDescription>
                  </motion.li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-5 pb-10 border rounded-xl bg-card shadow-sm dark:shadow-md dark:border-gray-700">
          {/* Search Bar */}
          <div className="flex items-center gap-2 mb-6">
            <Input
              type="text"
              placeholder="Search vendors by name, service, or city..."
              className="flex-1 rounded-[3px] text-xs md:text-base"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLocalSearch()} 
            />
            <Button onClick={handleLocalSearch} className="rounded-full  lg:rounded-[3px]">
              <Search className="w-4 h-4 lg:mr-1" />
              <p className="hidden  lg:block">Search</p>
            </Button>
          </div>

          <h1 className="text-2xl font-bold mb-6">
            {selectedService ? `Vendors for ${selectedService}` : "All Vendors"}
          </h1>
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <Loading />
            </div>
          ) : filteredVendors.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No vendors available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredVendors.map((vendor) => (
                  <motion.div
                    key={vendor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      href={`/search/${vendor.id}`}
                      className="relative group block rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-transform duration-300 hover:scale-105"
                    >
                      <div className="relative w-full h-56">
                        <Image
                          src={vendor.profileImage || "/placeholder-user.png"}
                          alt={vendor.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <div className="flex justify-between items-center mb-2">
                          <span className="bg-blue-500/90 px-3 py-1 rounded-full text-sm">
                            {vendor.service}
                          </span>
                          <div className="flex items-center bg-gray-900/80 px-2 py-1 rounded-full">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-sm font-semibold">
                              {vendor.rating || "4.5"}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold truncate">
                          {vendor.organizationName}
                        </h3>
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-1.5" />
                          <span className="truncate">{vendor.city || "N/A"}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CategoryPage