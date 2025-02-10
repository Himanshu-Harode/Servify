"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth, firestore } from "@/context/Firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import Header from "@/components/Header"
import HeroSection from "@/components/HeroSection"

import ProtectedRoute from "@/components/ProtectedRoute"
import Loading from "./loading"
import HomepageServiceCategory from "@/components/HomepageServiceCategory"

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.emailVerified) {
          try {
            const userDoc = await getDoc(doc(firestore, "users", user.uid))
            if (!userDoc.exists()) {
              const registrationData = localStorage.getItem("registrationData")
              const {
                firstName = "",
                lastName = "",
                email = "",
                role = "",
                address = "",
              } = registrationData ? JSON.parse(registrationData) : {}

              await setDoc(doc(firestore, "users", user.uid), {
                firstName,
                lastName,
                email: user.email,
                role,
                address,
              })

              // Clear registration data from local storage
              localStorage.removeItem("registrationData")
            }
            setUser(user)
            if (router.pathname !== "/") {
              router.push("/")
            }
          } catch (error) {
            console.error("Error accessing Firestore:", error)
          }
        } else {
          setUser(null)
          router.push("/login")
        }
      } else {
        setUser(null)
        router.push("/login")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return <Loading />
  }

  return (
    <ProtectedRoute roleRequired={["user"]}>
      <div className=" ">
        <Header />
        <HeroSection />
        <HomepageServiceCategory />
      </div>
    </ProtectedRoute>
  )
}
