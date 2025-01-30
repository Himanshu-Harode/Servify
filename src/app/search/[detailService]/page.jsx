"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { firestore } from "@/context/Firebase"
import { doc, getDoc, collection, getDocs } from "firebase/firestore"
import Loading from "@/app/loading"
import Image from "next/image"
import Header from "@/components/Header"
import {
  Clock2,
  Mail,
  MapPin,
  NotebookPen,
  Phone,
  Upload,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const ServiceDetail = () => {
  const { detailService } = useParams()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [similarServices, setSimilarServices] = useState([])

  useEffect(() => {
    if (!detailService) return

    const fetchUser = async () => {
      setLoading(true)
      try {
        const userDoc = doc(firestore, "users", detailService)
        const userSnapshot = await getDoc(userDoc)

        if (userSnapshot.exists()) {
          setUser(userSnapshot.data())
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    const fetchSimilarServices = async () => {
      try {
        const servicesCollection = collection(firestore, "users")
        const servicesSnapshot = await getDocs(servicesCollection)
        const services = servicesSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (service) =>
              service.id !== detailService && service.role === "vendor"
          )
        setSimilarServices(services)
      } catch (error) {
        console.error("Error fetching similar services:", error)
      }
    }

    fetchUser()
    fetchSimilarServices()
  }, [detailService])

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading />
      </div>
    )

  if (!user)
    return (
      <div className="text-center text-red-500 font-bold text-xl mt-10">
        User not found
      </div>
    )

  // Destructure user data
  const {
    organizationName,
    name,
    address,
    email,
    mobile,
    service,
    profileImage,
    description,
    availableTime,
    serviceImages,
  } = user

  return (
    <div className="">
      <Header />
      <div className="max-w-5xl mx-auto my-10 px-5 md:p-6 shadow-lg rounded-lg bg-card">
        <div className="flex flex-col md:flex-row gap-3 md:gap-6">
          <div className="flex flex-col items-center md:items-start">
            {profileImage ? (
              <Image
                src={profileImage}
                width={150}
                height={150}
                alt={organizationName}
                className="w-28 h-28 md:w-36 md:h-36 mt-4 object-cover rounded-full shadow-lg"
              />
            ) : (
              <div className="w-40 h-40 bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="flex-1 space-y-4 hidden md:block">
            <span className="inline-block px-2 py-1 md:px-4 md:py-2 text-sm font-bold text-primary bg-purple-300 rounded-full">
              {service}
            </span>
            <h3 className="text-2xl font-bold">{organizationName}</h3>
            <div className="flex gap-2">
              <MapPin className="w-5 h-5 text-purple-400" />
              <p className="flex  items-center gap-2  overflow-hidden  max-w-sm">
                {address}
              </p>
            </div>
            <h3 className="flex items-center gap-2 ">
              <Mail className="w-5 h-5 text-purple-400" />
              {email}
            </h3>
          </div>

            {/* Mobile View of Top */}

          <div className="md:hidden flex flex-col gap-2">
            <span className="flex justify-center items-center py-0.5 w-20  text-sm font-bold text-primary bg-purple-300 rounded-full">
              {service}
            </span>
            <h3 className="text-xl font-bold">{organizationName}</h3>
            <div className="flex justify-center items-center gap-2">
              <MapPin className="w-14 h-5 text-purple-400" />
              <p className="flex  items-center gap-2 text-sm overflow-hidden  ">
                {address}
              </p>
            </div>
            <h3 className="flex text-sm  items-center gap-3 ">
              <Mail className="w-5 h-5 text-purple-400" />
              {email}
            </h3>
            <h3 className="flex text-sm  items-center gap-3  ">
              <User className=" text-purple-400 w-5 h-5" />
              {name}
            </h3>
            <h3 className="flex text-sm  items-center gap-3 ">
              <Phone className=" w-5 h-5 text-purple-400" />
              {mobile}
            </h3>
            <h3 className="flex text-sm  items-center gap-3">
              <Clock2 className=" w-5 h-5 text-purple-400" />
              Available: {availableTime}
            </h3>
          </div>
          {/* Right Side - Contact & Availability */}
          <div className="md:mt-20 md:flex flex-col md:items-end space-y-4 hidden ">
            <h3 className="flex items-center gap-2  ">
              <User className=" text-purple-400 w-5 h-5" />
              {name}
            </h3>
            <h3 className="flex items-center gap-2 ">
              <Phone className=" w-5 h-5 text-purple-400" />
              {mobile}
            </h3>
            <h3 className="flex items-center gap-2">
              <Clock2 className=" w-5 h-5 text-purple-400" />
              Available: {availableTime}
            </h3>
          </div>
        </div>
        <div className="md:flex mt-20 gap-10 hidden">
          <div className="w-[70%]">
            <div className="">
              <h3 className="text-2xl font-bold">Description</h3>
              {description}
            </div>
            <h3 className="text-2xl font-bold my-10">Gallery</h3>
            <div className="grid grid-cols-4 gap-2">
              {serviceImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Service Image ${index + 1}`}
                  className="w-44 h-32 object-center rounded-md border-2 shadow-md"
                />
              ))}
            </div>
          </div>
          <div className="w-[30%]">
            <Button className="px-10 py-2 text-white w-full">
              <NotebookPen />
              Book Appointment
            </Button>
            <div className="">
              <h3 className="font-bold my-5 text-xl">Similar Services</h3>
              <div className="space-y-4">
                {similarServices.slice(0, 3).map((service) => (
                  <Link href={`/search/${service.id}`} key={service.id}>
                    <div className="flex shadow-md gap-2 rounded-md p-2 cursor-pointer hover:shadow-lg">
                      <Image
                        src={service.profileImage || "/placeholder.png"}
                        width={100}
                        height={100}
                        alt={service.name}
                        className="rounded-md h-28 w-auto object-cover"
                      />
                      <div className="space-y-3">
                        <h3 className="font-extrabold text-sm">
                          {service.organizationName}
                        </h3>
                        <p className="text-sm text-primary">{service.name}</p>
                        <p className="text-sm line-clamp-2">
                          {service.address}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View Bottom */}
        <div className="flex mt-10 flex-col gap-10 md:hidden">
          <div className="">
            <div className="mb-10">
              <h3 className="text-2xl mb-2 font-bold">Description</h3>
              {description}
            </div>
            <Button className="px-10 py-2 text-white w-full">
              <NotebookPen />
              Book Appointment
            </Button>
            <h3 className="text-2xl font-bold mt-10 mb-3">Gallery</h3>
            <div className="grid grid-cols-2 gap-2">
              {serviceImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Service Image ${index + 1}`}
                  className="w-36 h-24 object-center rounded-md border-2 shadow-md"
                />
              ))}
            </div>
          </div>
          <div className="md:hidden">
              <h3 className="font-bold my-5 text-2xl">Similar Services</h3>
              <div className="">
                {similarServices.slice(0, 3).map((service) => (
                  <Link href={`/search/${service.id}`} key={service.id}>
                    <div className="flex shadow-md gap-2 rounded-md p-2 cursor-pointer hover:shadow-lg">
                      <Image
                        src={service.profileImage || "/placeholder.png"}
                        width={100}
                        height={100}
                        alt={service.name}
                        className="rounded-md h-28 w-28 object-cover"
                      />
                      <div className="space-y-2 mt-2  ">
                        <h3 className="font-extrabold text-sm">
                          {service.organizationName}
                        </h3>
                        <p className="text-sm text-primary">{service.name}</p>
                        <p className="text-sm line-clamp-2">
                          {service.address}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceDetail
