"use client"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { FaHeart, FaLightbulb, FaHandshake } from "react-icons/fa"

export default function AboutUs() {
  const team = [
    {
      name: "John Doe",
      role: "CEO & Founder",
      bio: "Driven by passion to make service discovery seamless and efficient.",
      img: "/placeholder-user.png"
    },
    {
      name: "Jane Smith",
      role: "CTO",
      bio: "Tech innovator creating the backbone of Servify's smart features.",
      img: "/placeholder-user.png"
    },
    {
      name: "Mike Johnson",
      role: "Lead Developer",
      bio: "Full-stack architect building robust and scalable systems for Servify.",
      img:"/placeholder-user.png"
    }
  ]

  const values = [
    {
      icon: <FaHeart className="w-10 h-10 text-blue-500" />,
      title: "Customer-Centric",
      description: "We put customer satisfaction at the heart of everything we do."
    },
    {
      icon: <FaLightbulb className="w-10 h-10 text-yellow-500" />,
      title: "Innovation",
      description: "Empowering users with the latest tech for efficient service solutions."
    },
    {
      icon: <FaHandshake className="w-10 h-10 text-green-500" />,
      title: "Integrity",
      description: "Building trust with transparent and honest practices."
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative py-24 text-center"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-indigo-600 opacity-20" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
            About Servify
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Connecting people with the best service providers to enhance daily life.
          </p>
        </div>
      </motion.section>

      {/* Mission Statement */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto">
              To transform the way people find services by providing a reliable, transparent, and innovative platform.
            </p>
          </motion.div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-3 gap-12">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="p-8 bg-gray-100 dark:bg-gray-700 rounded-xl shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="text-blue-500 mb-6">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-center text-gray-900 dark:text-white mb-12">
            Meet the Servify Team
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
              >
                <div className="relative h-72 w-full">
                  <Image
                    src={member.img}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {member.name}
                  </h3>
                  <p className="text-blue-500 dark:text-blue-400 mb-4">
                    {member.role}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    {member.bio}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-16 bg-gradient-to-r from-teal-500 to-indigo-700 text-center"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-white mb-6">
            Join Us in Revolutionizing Service Discovery
          </h2>
          <Link href="/" className="bg-white text-teal-600 px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all">
            Get Started
          </Link>
        </div>
      </motion.section>
    </div>
  )
}
