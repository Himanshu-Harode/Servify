"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiHome, FiBox, FiClock, FiLogOut } from "react-icons/fi";
import { RiCustomerService2Line, RiProfileLine } from "react-icons/ri";
import { Star } from "react-feather";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { auth, firestore } from "@/context/Firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import Image from "next/image";
import { ModeToggle } from "@/components/ToggleTheme";
import { motion, AnimatePresence } from "framer-motion";
import Loading from "@/app/loading";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";

import {logoutUser} from "@/lib/logoutUser";
const VendorLayout = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const fetchData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        // Fetch user data
        const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
        if (userDoc.exists()) setUser(userDoc.data());

        // Fetch recent activities
        const bookingsQuery = query(
          collection(firestore, "bookings"),
          where("vendorId", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const activities = bookingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        }));
        setRecentActivities(activities);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    auth.onAuthStateChanged((user) => {
      if (user) fetchData();
      else router.push("/login");
    });
  }, [router]);

  const bottomNav = [
    {
      name: "Dashboard",
      icon: <FiHome className="w-5 h-5" />,
      path: "/vendor",
    },
    {
      name: "Profile",
      icon: <RiProfileLine className="w-5 h-5" />,
      path: "/vendor/profile",
    },
  ];
  const mainNav = [
    {
      name: "Dashboard",
      icon: <FiHome className="w-5 h-5" />,
      path: "/vendor",
    },
    {
      name: "Bookings",
      icon: <FiBox className="w-5 h-5" />,
      path: "/vendor/bookings",
    },
    {
      name: "Ratings",
      icon: <Star className="w-5 h-5" />,
      path: "/vendor/review",
    },
    {
      name: "Support",
      icon: <RiCustomerService2Line className="w-5 h-5" />,
      path: "/vendor/support",
    },
  ];
  const desktopNav = [
    {
      name: "Dashboard",
      icon: <FiHome className="w-5 h-5" />,
      path: "/vendor",
    },
    {
      name: "Bookings",
      icon: <FiBox className="w-5 h-5" />,
      path: "/vendor/bookings",
    },
    {
      name: "Ratings",
      icon: <Star className="w-5 h-5" />,
      path: "/vendor/review",
    },
    {
      name: "Support",
      icon: <RiCustomerService2Line className="w-5 h-5" />,
      path: "/vendor/support",
    },
    {
      name: "Profile",
      icon: <RiProfileLine className="w-5 h-5" />,
      path: "/vendor/profile",
    },
  ];

  const handleLogout = async () => {
    await logoutUser()
    // Optional: redirect after logout
    window.location.href = "/login"
  }

  if (loading || !isClient) return <Loading />;

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background to-background/95">
      {/* Sidebar for Desktop */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={cn(
          "z-50 fixed h-full transition-all duration-300 shadow-lg",
          "hidden lg:block lg:w-72 bg-background/95 backdrop-blur-md border-r overflow-y-auto scrollbar-hide" // Added scrollbar-hide
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex mx-auto">
            <Link href="/vendor">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center"
              >
                <Image
                  src="/logo.svg"
                  width={120}
                  height={40}
                  alt="Vendor Dashboard"
                  className="h-6 w-auto"
                  priority
                />
              </motion.div>
            </Link>
          </div>

          {/* User profile */}
          {user && (
            <div className="px-4 pb-6">
              <Card className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-none shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-white/20">
                    <AvatarImage src={user.profileImage || ""} />
                    <AvatarFallback className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      {user.name?.[0] || user.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium line-clamp-1">
                      {user.name || "Vendor"}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {user.email || ""}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {desktopNav.map((item, index) => (
              <Link
                key={item.name}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all",
                  pathname === item.path
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                    : "hover:bg-accent/50 text-foreground/80 hover:text-foreground"
                )}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Recent Activities */}
          <div className="px-4 py-6 border-t border-border/40">
            <h2 className="text-sm font-semibold text-foreground/80 mb-3">
              Recent Activities
            </h2>
            <div className="space-y-2">
              {recentActivities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card className="p-3 text-sm bg-background hover:bg-accent/30 transition-colors group">
                    <div className="flex flex-col gap-3 items-center justify-between">
                      <div className="flex justify-center items-center gap-2">
                        <p className="text-sm line-clamp-1 text-primary mb-1 group-hover:text-indigo-600">
                          {activity.userName}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            activity.status === "completed"
                              ? "bg-green-500/20 text-green-600"
                              : activity.status === "booked"
                              ? "bg-blue-500/20 text-blue-600"
                              : "bg-red-500/20 text-red-600"
                          }`}
                        >
                          {activity.status}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-xs flex items-center gap-3">
                        <p className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {activity.createdAt?.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                        <p>
                          {activity.createdAt?.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom actions */}
          <div className="p-4 border-t border-border/40 space-y-3">
            <div className="flex items-center justify-between">
              <ModeToggle />
              <Button
                variant="destructive"
                size="sm"
                className=" rounded-[5px]   flex items-center gap-2"
                onClick={handleLogout}
              >
                <FiLogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-screen w-64 bg-background/95 shadow-xl border-r lg:hidden overflow-y-auto scrollbar-hide" // Added scrollbar-hide
            >
              <div className="flex flex-col h-full">
                <div className="p-4 flex items-center justify-between border-b">
                  <Image
                    src="/logo.svg"
                    width={100}
                    height={35}
                    alt="Vendor Dashboard"
                    className="h-4 w-auto"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </Button>
                </div>

                {/* User profile for mobile */}
                {user && (
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImage || ""} />
                        <AvatarFallback className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                          {user.name?.[0] || user.email?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium line-clamp-1">
                          {user.name || "Vendor"}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {user.email || ""}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile navigation */}
                <nav className="flex-1 px-2 py-4 space-y-1">
                  {bottomNav.map((item, index) => (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                        pathname === item.path
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                          : "hover:bg-accent/50 text-foreground/80 hover:text-foreground"
                      )}
                    >
                      {item.icon}
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  ))}
                </nav>

                {/* Bottom mobile actions */}
                <div className="p-4 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <ModeToggle />
                    <Button
                      variant="destructive"
                      size="sm"
                      className=" rounded-[5px]  flex items-center gap-2"
                      onClick={handleLogout}
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <main className="flex-1 lg:pl-72">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex items-center justify-between p-4 bg-background/80 backdrop-blur-lg border-b lg:hidden">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-foreground/70 hover:text-foreground h-8 w-8 "
            >
              <HamburgerMenuIcon className="w-8 h-8" />
            </Button>
            <Link href="/vendor">
              <Image
                src="/logo.svg"
                width={80}
                height={30}
                alt="Vendor Dashboard"
                className="h-4 w-auto"
              />
            </Link>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={user.profileImage || ""} />
                <AvatarFallback className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  {user.name?.[0] || user.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </header>

        {/* Content wrapper */}
        <div className="p-1 md:p-6">{children}</div>
      </main>

      {/* Mobile navigation bar (at bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t lg:hidden">
        <div className="flex items-center justify-around h-16">
          {mainNav.map((item, index) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center px-1 py-2 rounded-md transition-all",
                pathname === item.path
                  ? "text-primary relative after:absolute after:bottom-0 after:left-1/2 after:transform after:-translate-x-1/2 after:w-1/2 after:h-0.5 after:bg-gradient-to-r after:from-indigo-600 after:to-purple-600"
                  : "text-muted-foreground"
              )}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "p-1.5 rounded-md",
                  pathname === item.path && "bg-primary/10"
                )}
              >
                {item.icon}
              </motion.div>
              <span className="text-xs mt-0.5">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default VendorLayout;
