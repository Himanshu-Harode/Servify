"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { firestore, auth } from "@/context/Firebase"
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore"
import Loading from "@/app/loading"
import Image from "next/image"
import Header from "@/components/Header"
import {
  Clock2,
  Mail,
  MapPin,
  NotebookPen,
  Phone,
  User,
  AlertCircle,
  User2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

const ServiceDetail = () => {
  const { detailService } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [similarServices, setSimilarServices] = useState([])
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [existingBooking, setExistingBooking] = useState(null)
  const [isBooking, setIsBooking] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!detailService) return

    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch vendor data
        const userDoc = doc(firestore, "users", detailService)
        const userSnapshot = await getDoc(userDoc)
        if (!userSnapshot.exists()) throw new Error("Vendor not found")
        const userData = userSnapshot.data()
        setUser(userData)

        // Fetch similar services with the same service type
        const servicesSnapshot = await getDocs(collection(firestore, "users"))
        const services = servicesSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (service) =>
              service.id !== detailService &&
              service.role === "vendor" &&
              service.service === userData.service // Filter by same service
          )
        setSimilarServices(services)

        // Check existing bookings
        if (currentUser) {
          const bookingsQuery = query(
            collection(firestore, "bookings"),
            where("userId", "==", currentUser.uid),
            where("vendorId", "==", detailService),
            where("status", "in", ["booked", "accepted"])
          )

          const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
            setExistingBooking(snapshot.docs[0]?.data())
          })
          return unsubscribe
        }
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [detailService, currentUser])
  const handleBooking = async () => {
    setIsBooking(true)
    try {
      if (!currentUser) {
        toast({
          title: "Authentication Required",
          description: "Please login to book this service",
          variant: "destructive",
        })
        return router.push("/login")
      }

      if (existingBooking) {
        toast({
          title: "Booking Exists",
          description: `You already have a ${existingBooking.status} booking with this vendor`,
          variant: "destructive",
        })
        return
      }

      // Fetch user details from Firestore
      const userDoc = await getDoc(doc(firestore, "users", currentUser.uid))
      if (!userDoc.exists()) throw new Error("User profile not found")

      const userData = userDoc.data()
      const userName = `${userData.firstName || ""} ${
        userData.lastName || ""
      }`.trim()

      await addDoc(collection(firestore, "bookings"), {
        userId: currentUser.uid,
        vendorId: detailService,
        userName: userName || "Anonymous User",
        userEmail: currentUser.email,
        organizationName: user.organizationName,
        vendorName: user.name,
        vendorProfile: user.profileImage,
        vendorService: user.service,
        vendorAddress: user.address,
        status: "booked",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      toast({
        title: "Booking Successful",
        description: "Your booking request has been submitted",
        className: "bg-green-500 text-white",
      })
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsBooking(false)
    }
  }

  if (loading) return <Loading />
  if (error)
    return (
      <div className="text-center text-red-500 font-bold text-xl mt-10">
        {error}
      </div>
    )
  if (!user)
    return (
      <div className="text-center text-red-500 font-bold text-xl mt-10">
        User not found
      </div>
    )

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
    <div className="min-h-screen bg-background">
      <Header />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto p-4 md:p-6"
      >
        {/* Vendor Profile Section */}
        <div className="bg-card rounded-xl p-6 shadow-sm dark:shadow-md dark:border dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <motion.div
              className="flex flex-col items-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <div className="relative w-32 h-32 md:w-48 md:h-48 group">
                <Image
                  src={profileImage || "/placeholder-user.png"}
                  alt={organizationName}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="rounded-full object-cover border-4 border-primary/10 group-hover:border-primary/30 transition-all duration-300"
                  priority
                />
              </div>
              <span className="mt-4 px-4 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
                {service}
              </span>
            </motion.div>

            {/* Vendor Info */}
            <div className="flex-1 space-y-4">
              <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-purple-600 bg-clip-text ">
                {organizationName}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: MapPin, text: address },
                  { icon: Mail, text: email },
                  { icon: User, text: name },
                  { icon: Phone, text: mobile },
                  { icon: Clock2, text: `Available: ${availableTime}` },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                  >
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td className="p-2">
                            <item.icon className="w-5 h-5 text-primary" />
                          </td>
                          <td className="p-2 text-foreground">{item.text}</td>
                        </tr>
                      </tbody>
                    </table>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Section */}
          <div className="mt-6 flex flex-col gap-4">
            {existingBooking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 bg-yellow-500/10 p-4 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-500">
                  You have a {existingBooking.status} booking with this vendor
                </span>
              </motion.div>
            )}

            <motion.div whileHover={{ scale: 1.02 }}>
              <Button
                onClick={handleBooking}
                disabled={!!existingBooking || isBooking}
                className="w-full md:w-64 gap-2 relative overflow-hidden rounded-full"
              >
                <div className="flex items-center gap-2 relative z-10">
                  <NotebookPen className="w-5 h-5" />
                  {isBooking
                    ? "Processing..."
                    : existingBooking
                    ? "Booking Exists"
                    : "Book Appointment"}
                </div>
                {isBooking && (
                  <motion.div
                    className="absolute inset-0 bg-primary/10 z-0"
                    animate={{
                      background: [
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
                      ],
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-8 grid md:grid-cols-2 gap-8">
          {/* Description & Gallery */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Service Details
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {description || "No description provided"}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Gallery
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {serviceImages?.length > 0 ? (
                  serviceImages.map((image, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.03 }}
                      className="aspect-square relative overflow-hidden border-2 rounded-xl border-muted"
                    >
                      <Image
                        src={image}
                        alt={`Service image ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover "
                        priority
                      />
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    No gallery images available
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Similar Services */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">
              Similar Services
            </h2>
            <div className="space-y-4">
              {similarServices.slice(0, 3).map((service) => (
                <Link href={`/search/${service.id}`} key={service.id}>
                  <motion.div
                    whileHover={{ translateX: 5 }}
                    className="flex items-center gap-4 p-4 bg-card  hover:shadow-md transition-shadow border border-muted rounded-xl"
                  >
                    <div className="relative w-20 h-20 shrink-0">
                      <Image
                        src={service.profileImage || "/placeholder-user.png"}
                        alt={service.organizationName}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="rounded-xl object-cover"
                        priority
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {service.organizationName}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        <User2 className="inline w-4 h-4 mr-1" />
                        {service.firstName + " " + service.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <MapPin className="inline w-4 h-4 mr-1" />
                        {service.address}
                      </p>
                      <p className="text-sm text-primary mt-2">
                        {service.service}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ServiceDetail
