"use client"

import { useEffect, useState } from "react"
import { firestore } from "@/context/Firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Slack } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import ComponentLoader from "./ui/componentLoader"
import { Pagination } from "@/components/ui/pagination" // Import ShadCN Pagination

const HomepageServiceCategory = () => {
  const [services, setServices] = useState([])
  const [vendors, setVendors] = useState([])
  const [filteredVendors, setFilteredVendors] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [loading, setLoading] = useState(false) // Loader state for vendors
  const [currentVendorPage, setCurrentVendorPage] = useState(1) // For vendor pagination
  const vendorsPerPage = 8 // Number of vendors per page

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

  // Fetch all vendors (only those with role "vendor")
  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true) // Start loading
      try {
        const querySnapshot = await getDocs(collection(firestore, "users"))
        const vendorsData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((vendor) => vendor.role === "vendor") // Only vendors

        setVendors(vendorsData)
        setFilteredVendors(vendorsData) // Initially show all vendors
      } catch (error) {
        console.error("Error fetching vendors:", error)
      } finally {
        setLoading(false) // Stop loading
      }
    }

    fetchVendors()
  }, [])

  // Filter vendors based on selected service
  const handleServiceClick = (serviceName) => {
    if (selectedService === serviceName) {
      setSelectedService(null)
      setFilteredVendors(vendors) // Show all vendors
    } else {
      setSelectedService(serviceName)
      setLoading(true) // Start loading while filtering
      setTimeout(() => {
        setFilteredVendors(
          vendors.filter((vendor) => vendor.service === serviceName)
        )
        setCurrentVendorPage(1) // Reset vendor pagination to page 1
        setLoading(false) // Stop loading after filtering
      }, 500) // Small delay for UX smoothness
    }
  }

  // Pagination logic for vendors
  const totalVendorPages = Math.ceil(filteredVendors.length / vendorsPerPage)
  const paginatedVendors = filteredVendors.slice(
    (currentVendorPage - 1) * vendorsPerPage,
    currentVendorPage * vendorsPerPage
  )

  return (
    <div className="md:p-4 py-10 md:w-[85%] mx-auto">
      {/* Service Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 px-10 md:p-0 lg:grid-cols-6 gap-4">
        {services.slice(0, 5).map((service) => (
          <div
            key={service.id}
            className={`flex justify-center items-center flex-col p-4 w-28 h-24 dark:bg-card shadow-md rounded-lg cursor-pointer ${
              selectedService === service.name ? "border-2 border-blue-500" : ""
            }`}
            onClick={() => handleServiceClick(service.name)}
          >
            <img
              src={service.image}
              alt={service.name}
              className="h-12 object-cover rounded-lg"
            />
            <h2 className="text-primary capitalize font-semibold mt-2 text-sm">
              {service.name}
            </h2>
          </div>
        ))}
        <Link href="/category">
          <div className="flex justify-center items-center flex-col p-4 w-28 h-24 dark:bg-card  shadow-md rounded-lg cursor-pointer">
            <Slack className="h-20 w-20 object-cover rounded-lg" />
            <h2 className="font-semibold text-primary mt-2 text-sm text-center">
              Categories
            </h2>
          </div>
        </Link>
      </div>

      {/* Display Vendors */}
      <div className="mt-6">
        <h2 className="text-xl font-bold">
          {selectedService ? `Vendors for ${selectedService}` : "All Vendors"}
        </h2>

        {loading ? (
          <div className="flex justify-center h-96 items-center mt-4">
            <ComponentLoader />
          </div>
        ) : paginatedVendors.length === 0 ? (
          <p className="text-gray-500">No vendors available.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {paginatedVendors.map((vendor) => (
              <Link href={`/search/${vendor.id}`} key={vendor.id}>
                <div className="shadow-lg bg-secondary rounded-xl hover:border-2 hover:border-primary border-2 ">
                  <Image
                    src={vendor.profileImage}
                    width={100}
                    height={100}
                    className="w-full h-36 md:h-52 rounded-t-xl object-center"
                    alt="Vendor Image"
                  />
                  <div className="p-4 space-y-2 bg-card rounded-xl">
                    <span className="text-xs rounded-3xl px-2 py-1 md:py-2 md:px-4 text-primary font-bold bg-purple-300">
                      {vendor.service}
                    </span>
                    <h3 className="font-bold md:text-2xl">
                      {vendor.organizationName}
                    </h3>
                    <h3 className="font-semibold text-primary text-sm">
                      {vendor.name}
                    </h3>
                    <p className="text-gray-500 line-clamp-1 text-xs">
                      {vendor.address}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalVendorPages > 1 && (
        <div className="flex justify-center items-center mt-6">
          <Pagination
            totalPages={totalVendorPages}
            currentPage={currentVendorPage}
            onPageChange={(page) => setCurrentVendorPage(page)}
          />
        </div>
      )}
    </div>
  )
}

export default HomepageServiceCategory
