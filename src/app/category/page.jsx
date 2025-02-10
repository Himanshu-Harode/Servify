"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { firestore } from "@/context/Firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import Loading from "../loading";
import Header from "@/components/Header";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Star, MapPin } from "lucide-react";

const CategoryPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedService = searchParams.get("service");

  const [services, setServices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [serviceSnapshot, vendorSnapshot] = await Promise.all([
          getDocs(collection(firestore, "service")),
          getDocs(collection(firestore, "users")),
        ]);

        const servicesData = serviceSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.name.localeCompare(b.name));
        setServices(servicesData);

        let vendorsData = vendorSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).filter((v) => v.role === "vendor");
        setVendors(vendorsData);
        setFilteredVendors(selectedService ? vendorsData.filter((v) => v.service === selectedService) : vendorsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedService]);

  const handleServiceClick = (serviceName) => {
    router.push(serviceName === selectedService ? "/category" : `/category?service=${serviceName}`);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex flex-col md:flex-row gap-6 my-6 mx-auto max-w-7xl px-4">
        {/* Sidebar */}
        <div className="hidden md:block w-64 p-4 border rounded-lg bg-card h-full sticky top-20">
          <h2 className="text-xl font-bold text-primary">Service Categories</h2>
          <ul className="mt-4 space-y-2">
            {services.map((service) => (
              <li key={service.id}>
                <button
                  onClick={() => handleServiceClick(service.name)}
                  className={`block w-full text-left p-2 rounded-md font-medium border hover:border-primary ${selectedService === service.name ? "bg-primary text-white" : "hover:bg-gray-100"}`}
                >
                  {service.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger className="p-2 rounded-md bg-primary text-white">
              <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="left" className="p-4 w-64">
              <SheetHeader>
                <SheetTitle>Service Categories</SheetTitle>
              </SheetHeader>
              <ul className="space-y-2">
                {services.map((service) => (
                  <li key={service.id}>
                    <button
                      onClick={() => handleServiceClick(service.name)}
                      className={`block w-full text-left p-2 rounded-md border hover:border-primary ${selectedService === service.name ? "bg-primary text-white" : "hover:bg-gray-100"}`}
                    >
                      {service.name}
                    </button>
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>
        </div>

        {/* Vendor List */}
        <div className="flex-1 p-4 border rounded-lg bg-card">
          <h1 className="text-2xl font-bold">{selectedService ? `Vendors for ${selectedService}` : "All Vendors"}</h1>
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <Loading />
            </div>
          ) : filteredVendors.length === 0 ? (
            <p className="text-gray-500">No vendors available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {filteredVendors.map((vendor) => (
                <Link key={vendor.id} href={`/search/${vendor.id}`} className="relative group block rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-transform duration-300 hover:scale-105">
                  <div className="relative w-full h-56">
                    <Image src={vendor.profileImage || "/placeholder-user.png"} alt={vendor.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-blue-500/90 px-3 py-1 rounded-full text-sm">{vendor.service}</span>
                      <div className="flex items-center bg-gray-900/80 px-2 py-1 rounded-full">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-semibold">{vendor.rating || "4.5"}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold truncate">{vendor.organizationName}</h3>
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-1.5" />
                      <span className="truncate">{vendor.city || "N/A"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
