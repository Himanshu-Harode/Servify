"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AboutUs() {
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
            Servify is a platform designed to bridge the gap between service providers and customers, offering a seamless way to discover, connect, and book services effortlessly.
          </p>
        </div>
      </motion.section>

      {/* Success Metrics */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8">
              Our Success in Numbers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold">10,000+</h3>
                <p className="text-lg">Happy Customers</p>
              </Card>
              <Card className="p-6 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold">5,000+</h3>
                <p className="text-lg">Verified Professionals</p>
              </Card>
              <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold">95%</h3>
                <p className="text-lg">Customer Satisfaction</p>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Purpose & Target Audience */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8">
              Why Use Servify?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto">
              Whether you need a plumber, electrician, interior designer, or any other local service, Servify makes the process easy. Our platform ensures verified professionals, transparent pricing, and hassle-free bookings.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8">
              Who is Servify For?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto">
              Servify is designed for homeowners, businesses, and individuals looking for reliable services in their area. It also serves service providers who want to expand their reach and grow their customer base through a trusted platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full max-w-2xl mx-auto">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-semibold text-gray-900 dark:text-white">
                  How does Servify ensure service quality?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300">
                  Servify verifies all professionals on the platform, ensuring they meet our quality standards. We also collect customer feedback to maintain high service quality.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg font-semibold text-gray-900 dark:text-white">
                  Is Servify available in my area?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300">
                  Servify is available in most regions. Simply enter your location to see available services and professionals near you.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-lg font-semibold text-gray-900 dark:text-white">
                  How do I book a service on Servify?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300">
                  Booking a service is easy! Search for the service you need, select a professional, and book directly through the platform.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </section>
    </div>
  );
}