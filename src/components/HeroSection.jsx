import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

const HeroSection = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px] px-4 py-8 md:py-12 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Background animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-purple-100/20 dark:from-gray-800/50 dark:to-gray-900/50"
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto text-center space-y-6">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold leading-tight md:leading-snug"
        >
          Your{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Home Services
          </span>
          ,
          <br className="hidden md:block" /> Just a Click Away!
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
        >
          Discover trusted professionals for all your home needs. Fast,
          reliable, and hassle-free.
        </motion.p>

        {/* Compact Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full max-w-md mx-auto mt-8"
        >
          <div className="flex items-center bg-white dark:bg-gray-800 backdrop-blur-lg rounded-full shadow-lg p-1.5 border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search for services..."
              className="flex-1 px-4 py-2.5 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm md:text-base"
            />
            <Button
              className="rounded-full p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
              size="sm"
            >
              <Search className="w-4 h-4 text-white" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
        </motion.div>

        {/* Feature badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mt-8"
        >
          {[
            { icon: "⚡", text: "Instant Booking" },
            { icon: "✅", text: "Verified Pros" },
            { icon: "⭐", text: "5-Star Ratings" },
            { icon: "💳", text: "Secure Payments" },
          ].map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm text-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700"
            >
              <span>{feature.icon}</span>
              <span>{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Decorative shapes */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute -bottom-40 -left-20 w-72 h-72 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl"
      />
    </div>
  )
}

export default HeroSection
