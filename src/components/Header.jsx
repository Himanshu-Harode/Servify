"use client"
import Image from "next/image"
import { ModeToggle } from "./ToggleTheme"
import { Button } from "./ui/button"
import Link from "next/link"
import { doc, getDoc } from "firebase/firestore"
import ProfileMenu from "./ProfileMenu"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth, firestore } from "@/context/Firebase"
import Loading from "@/app/loading"

const Header = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // Track loading state for Firestore data
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(firestore, "users", user.uid)
          const userDocSnap = await getDoc(userDocRef)

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data()

            setUser(userData)
          } else {
            console.log("User data not found in Firestore")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
        setLoading(false)
      } else {
        setUser(null)
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return null
  }

  return (
    <div className="md:p-5 py-5 px-3 shadow-lg  dark:shadow-sm dark:shadow-gray-800  flex justify-between">
      <div className="flex items-center gap-8">
        <Image
          loading="lazy"
          src="/logo.svg"
          alt="logo"
          className="w-[200px]"
          width={100}
          height={100}
        />

        <div className="lg:flex hidden items-center gap-6">
          <h1 className="hover:scale-105  hover:text-primary cursor-pointer transition-all duration-300 ease-in-out">
            <Link href="/"> Home</Link>
          </h1>
          <h1 className="hover:scale-105 hover:text-primary cursor-pointer transition-all duration-300 ease-in-out">
            <Link href="/myBooking"> My Bookings</Link>
          </h1>
          <h1 className="hover:scale-105 hover:text-primary cursor-pointer transition-all duration-300 ease-in-out">
            <Link href="/aboutUs"> About Us</Link>
          </h1>
        </div>
      </div>

      <div className="flex justify-center  ml-5 md:ml-0 gap-2 md:gap-10 items-center">
        <div className="hidden md:block">
          {" "}
          <ModeToggle />
        </div>
        {user ? (
          <ProfileMenu />
        ) : (
          <Button className="text-white">
            <Link href={"login"}>Get Started</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
export default Header
