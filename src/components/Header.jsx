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
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"

const Header = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(firestore, "users", user.uid)
          const userDocSnap = await getDoc(userDocRef)
          if (userDocSnap.exists()) setUser(userDocSnap.data())
        } catch (error) {
          console.error("Error fetching user data:", error)
        } finally {
          setLoading(false)
        }
      } else {
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router])

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "My Bookings", path: "/myBooking" },
    { name: "About Us", path: "/aboutUs" },
  ]

  if (loading) return <Loading />

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 md:py-2 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2"
            >
              <Image
                src="/logo.svg"
                alt="logo"
                width={100}
                height={100}
                className="w-32 md:w-40"
                priority
              />
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <motion.div key={link.path} whileHover={{ y: -2 }}>
                  <Link
                    href={link.path}
                    className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-purple-400 transition-colors font-medium"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <ModeToggle />
            </div>

            {user ? (
              <ProfileMenu />
            ) : (
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Link href="/login">Get Started</Link>
                </Button>
              </motion.div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden py-4 space-y-4"
            >
              {navLinks.map((link) => (
                <motion.div key={link.path} whileHover={{ x: 5 }}>
                  <Link
                    href={link.path}
                    className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-purple-400"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <div className="px-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <ModeToggle />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}

export default Header
