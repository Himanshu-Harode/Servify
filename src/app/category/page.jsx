"use client"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { firestore } from "@/context/Firebase"
import { collection, getDocs } from "firebase/firestore"
import Loading from "../loading"
import Header from "@/components/Header"
import Image from "next/image"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react"

const CategoryPage = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedService = searchParams.get("service") // Get service from URL

  const [services, setServices] = useState([])
  const [vendors, setVendors] = useState([])
  const [filteredVendors, setFilteredVendors] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch all services (sorted alphabetically)
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "service"))
        const servicesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        servicesData.sort((a, b) => a.name.localeCompare(b.name))

        setServices(servicesData)
      } catch (error) {
        console.error("Error fetching services:", error)
      }
    }

    fetchServices()
  }, [])

  // Fetch all vendors
  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true)
      try {
        const querySnapshot = await getDocs(collection(firestore, "users"))
        let vendorsData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((vendor) => vendor.role === "vendor")

        if (!selectedService) {
          vendorsData.sort((a, b) => a.name.localeCompare(b.name))
        }

        setVendors(vendorsData)
        setFilteredVendors(
          selectedService
            ? vendorsData.filter((vendor) => vendor.service === selectedService)
            : vendorsData
        )
      } catch (error) {
        console.error("Error fetching vendors:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [selectedService])

  const handleServiceClick = (serviceName) => {
    if (selectedService === serviceName) {
      window.history.pushState({}, "", `/category`)
    } else {
      window.history.pushState({}, "", `/category?service=${serviceName}`)
    }

    setLoading(true)
    setTimeout(() => {
      setFilteredVendors(
        selectedService === serviceName
          ? vendors
          : vendors.filter((vendor) => vendor.service === serviceName)
      )
      setLoading(false)
    }, 500)
  }

  const handleVendorClick = (vendor) => {
    router.push(`/search/${vendor.id}`)
  }

  return (
    <div className="">
      <Header />
      <div className="flex gap-3 my-5 md:my-10 md:gap-5 flex-col md:flex-row">
        {/* Sidebar with all services */}
        <div className="w-64 p-4 hidden md:block border rounded-xl bg-card h-full">
          <h2 className="text-2xl font-extrabold mb-4 text-primary">
            Service Categories
          </h2>
          <ul className="flex flex-col gap-2 ">
            {services.map((service) => (
              <li key={service.id} className="border-2  rounded-md">
                <button
                  onClick={() => handleServiceClick(service.name)}
                  className={`block w-full text-left p-2 rounded-md ${
                    selectedService === service.name
                      ? "bg-purple-100 text-primary border-2 dark:bg-card border-primary dark:text-primary"
                      : "hover:border-2 hover:border-primary hover:bg-card hover:dark:text-primary"
                  }`}
                >
                  {service.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
            {/* Mobile Services Menu  */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="text-2xl font-extrabold mb-4 text-primary">
                  Service Categories
                </SheetTitle>
                <SheetDescription>
                  <ul className="flex flex-col gap-2 ">
                    {services.map((service) => (
                      <li key={service.id} className="border-2  rounded-md">
                        <button
                          onClick={() => handleServiceClick(service.name)}
                          className={`block w-full text-left p-2 rounded-md ${
                            selectedService === service.name
                              ? "bg-purple-100 text-primary border-2 dark:bg-card border-primary dark:text-primary"
                              : "hover:border-2 hover:border-primary hover:bg-card hover:dark:text-primary"
                          }`}
                        >
                          {service.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>

        {/* Vendor List */}
        <div className="md:flex-1 h-screen p-2 md:p-6 bg-card rounded-xl border">
          <h1 className="text-2xl font-bold">
            {selectedService ? `Vendors for ${selectedService}` : "All Vendors"}
          </h1>

          {loading ? (
            <div className="flex justify-center items-center h-96">
              <Loading />
            </div>
          ) : filteredVendors.length === 0 ? (
            <p className="text-gray-500">No vendors available.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 ">
              {filteredVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  onClick={() => handleVendorClick(vendor)}
                  className="shadow-lg  border rounded-xl cursor-pointer hover:shadow-xl transition hover:border-2 hover:border-primary hover:scale-[1.01]"
                >
                  <Image
                    src={vendor.profileImage}
                    width={100}
                    height={100}
                    alt={vendor.id}
                    className="w-full h-28 object-fill rounded-md"
                  />

                  <div className="p-4 space-y-2 bg-card rounded-xl">
                    <span className="text-xs rounded-3xl py-2 px-4 text-primary font-semibold bg-purple-300">
                      {vendor.service}
                    </span>
                    <h3 className="font-bold ">
                      {vendor.organizationName}
                    </h3>
                    <h3 className="font-semibold text-sm text-primary">
                      {vendor.name}
                    </h3>
                    <p className="text-gray-500 line-clamp-1 text-xs">
                      {vendor.address}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CategoryPage
