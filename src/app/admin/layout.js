"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { ModeToggle } from "@/components/ToggleTheme"
import ProfileMenu from "@/components/ProfileMenu"
import { DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

const AdminLinks = [
  { name: "Home", path: "/admin" },
  { name: "Dashboard", path: "/admin/dashboard" },
  { name: "Services", path: "/admin/services" },
  { name: "Bookings", path: "/admin/bookings" },
]

export default function AdminLayout({ children }) {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-screen">
      {/* Sidebar for Desktop */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className="hidden lg:block w-64 bg-gray-100 dark:bg-gray-900 p-2 border-r border-gray-200 dark:border-gray-700"
      >
        {/* Logo */}
        <div className="">
          <Link href={"/admin"}>
            <Image
              src="/logo.svg"
              alt="Logo"
              width={120}
              height={40}
              className="w-48 "
            />
          </Link>
        </div>
        {/* Navigation Links */}
        <nav className="flex flex-col gap-2">
          {AdminLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                pathname === link.path
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </motion.aside>

      {/* Mobile Sidebar */}
      <Sheet open={isSideMenuOpen} onOpenChange={setIsSideMenuOpen}>
        <SheetTrigger asChild className="hidden lg:block">
          <Button variant="ghost" className="lg:hidden p-2">
            <Menu size={24} />
          </Button>
        </SheetTrigger>
        <DialogContent className="hidden">
          <DialogTitle>daf</DialogTitle>
          <DialogDescription>sad</DialogDescription>
        </DialogContent>
        <SheetContent side="left" className="w-64 bg-gray-100 dark:bg-gray-900">
          {/* Logo */}
          <div className="mb-6">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={120}
              height={40}
              className="w-32"
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {AdminLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  pathname === link.path
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                }`}
                onClick={() => setIsSideMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              className="lg:hidden p-2"
              onClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
            >
              <Menu size={24} />
            </Button>

            {/* Right Section (e.g., Profile Menu, Theme Toggle) */}
            <div className="flex w-full gap-4 justify-end lg:mr-20">
              <div className="hidden md:block">
                <ModeToggle />
              </div>

              <ProfileMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  )
}
