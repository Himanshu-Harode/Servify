"use client";

import { useEffect, useState } from "react";
import { auth, firestore } from "@/context/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOutIcon, UserPen, ChevronDown } from "lucide-react";
import Link from "next/link";

const ProfileMenu = () => {
  const [user, setUser] = useState(null);
  const [vendorStats, setVendorStats] = useState({
    rating: 0,
    totalBookings: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async (userId) => {
      try {
        // Fetch user data from the `users` collection
        const userDocRef = doc(firestore, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUser(userData);

          // Fetch bookings data for the vendor
          if (userData.role === "vendor") {
            const bookingsQuery = query(
              collection(firestore, "bookings"),
              where("vendorId", "==", userId)
            );
            const bookingsSnapshot = await getDocs(bookingsQuery);

            // Calculate total bookings and completed bookings
            let totalBookings = 0;
            let completedBookings = 0;

            bookingsSnapshot.forEach((doc) => {
              const bookingData = doc.data();
              totalBookings++;
              if (bookingData.status === "completed") {
                completedBookings++;
              }
            });

            // Calculate success rate
            const successRate =
              totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

            // Set vendor stats
            setVendorStats({
              rating: userData.averageRating || 0,
              totalBookings,
              successRate,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserData(user.uid);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const profileUrl =
    user?.role === "vendor"
      ? "/vendor/profile"
      : user?.role === "admin"
      ? "/admin/profile"
      : "/profile";

  if (loading) return <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <DropdownMenu onOpenChange={(open) => setIsOpen(open)}>
        <DropdownMenuTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative p-1 dark:p-0.5 rounded-full cursor-pointer bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg transition-shadow"
          >
            <div className="bg-white dark:bg-gray-800 rounded-full p-0.5">
              <Avatar className="w-10 h-10 border-2 border-transparent group-hover:border-blue-500/20 transition-all">
                <AvatarImage
                  src={user?.profileImage}
                  alt={user?.firstName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  {user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>

            <motion.div
              animate={{
                rotate: isOpen ? 180 : 0,
                scale: isOpen ? 1.1 : 1,
              }}
              className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <ChevronDown size={14} className="text-gray-600 dark:text-gray-300" />
            </motion.div>
          </motion.div>
        </DropdownMenuTrigger>

        <AnimatePresence>
          <DropdownMenuContent
            asChild
            align="end"
            className="mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-0 overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 pb-6">
                <div className="flex items-center gap-3">
                  <motion.div whileHover={{ scale: 1.05 }} className="relative">
                    <Avatar className="w-12 h-12 border-2 border-white/20 shadow-lg">
                      <AvatarImage src={user?.profileImage} className="object-cover" />
                      <AvatarFallback className="bg-white/20 text-white">
                        {user?.firstName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700">
                      {user?.role?.toUpperCase()}
                    </div>
                  </motion.div>
                  <div>
                    <p className="font-semibold text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-white/90 mt-0.5">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 space-y-2">
                {user?.role === "vendor" && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      {
                        value: vendorStats.rating,
                        label: "Rating",
                        icon: "⭐",
                      },
                      {
                        value: vendorStats.totalBookings,
                        label: "Bookings",
                        icon: "📅",
                      },
                      {
                        value: `${vendorStats.successRate}%`,
                        label: "Success",
                        icon: "🚀",
                      },
                    ].map((stat, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ y: -2 }}
                        className="text-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 backdrop-blur-sm"
                      >
                        <p className="font-bold text-blue-500 dark:text-purple-400 flex items-center justify-center gap-1">
                          <span>{stat.icon}</span>
                          {stat.value}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          {stat.label}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}

                <DropdownMenuItem asChild>
                  <Link
                    href={profileUrl}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:hover:from-gray-700/50 dark:hover:to-gray-700/70 transition-all"
                  >
                    <span className="text-blue-500 dark:text-purple-400">
                      <UserPen size={18} />
                    </span>
                    <span className="flex-1">Edit Profile</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 h-[2px]" />

                <motion.div whileHover={{ scale: 1.02 }} className="px-3">
                  <Button
                    onClick={() => auth.signOut()}
                    className="w-full justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all"
                  >
                    <LogOutIcon className="w-5 h-5" />
                    <span>Sign Out</span>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </DropdownMenuContent>
        </AnimatePresence>
      </DropdownMenu>
    </motion.div>
  );
};

export default ProfileMenu;