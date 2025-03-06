"use client";

import { useState } from "react";
import { firestore, auth } from "@/context/Firebase";
import { collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Loading from "@/app/loading";

const VendorSupportPage = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // State to disable the button

  // Handle query submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter your query before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Not Authenticated",
          description: "Please log in to submit a query.",
          variant: "destructive",
        });
        return;
      }

      // Add query to Firestore
      await addDoc(collection(firestore, "customerSupport"), {
        userId: user.uid,
        query,
        timestamp: new Date(),
        status: "pending", // Default status
      });

      toast({
        title: "Query Submitted",
        description: "Your query has been sent to our support team.",
        className: "bg-green-500 text-white",
      });
      setQuery("");

      // Disable the button for 2 minutes
      setIsButtonDisabled(true);
      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 2 * 60 * 1000); // 2 minutes
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🛠️ Vendor Support
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          We're here to help! Submit your query or check out our FAQs.
        </p>
      </div>

      {/* Query Submission Field */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Submit Your Query
        </h2>
        <form onSubmit={handleSubmit}>
          <Textarea
            placeholder="Enter your query here..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-[5px] p-4 mb-4 bg-white dark:bg-gray-700"
            rows={4}
          />
          <Button
            type="submit"
            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-[5px]"
            disabled={loading || isButtonDisabled}
          >
            {loading ? "Submitting..." : isButtonDisabled ? "Submitted ✅" : "Submit Query"}
          </Button>
          {isButtonDisabled && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              You can submit another query in 2 minutes.
            </p>
          )}
        </form>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {/* FAQ 1 */}
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-4">
              How do I create a new booking?
            </AccordionTrigger>
            <AccordionContent className="text-gray-700 dark:text-gray-300 px-4">
              To create a new booking, navigate to the "Bookings" tab in your dashboard and click on the "New Booking" button. Fill in the required details and submit the form.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 2 */}
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-4">
              How can I update my profile information?
            </AccordionTrigger>
            <AccordionContent className="text-gray-700 dark:text-gray-300 px-4">
              You can update your profile information by going to the "Profile" section in your dashboard. Click on the "Edit" button, make the necessary changes, and save.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 3 */}
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-4">
              How do I connect with customer support?
            </AccordionTrigger>
            <AccordionContent className="text-gray-700 dark:text-gray-300 px-4">
              You can connect with our customer support team by submitting a query using the form above or by emailing us at support@vendorsapp.com.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 4 */}
          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-4">
              What payment methods are supported?
            </AccordionTrigger>
            <AccordionContent className="text-gray-700 dark:text-gray-300 px-4">
              We support all major payment methods, including credit/debit cards, PayPal, and bank transfers. You can manage your payment methods in the "Payments" section.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 5 */}
          <AccordionItem value="item-5">
            <AccordionTrigger className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-4">
              How do I cancel a booking?
            </AccordionTrigger>
            <AccordionContent className="text-gray-700 dark:text-gray-300 px-4">
              To cancel a booking, go to the "Bookings" tab, find the booking you want to cancel, and click on the "Cancel" button. Provide a reason for cancellation and confirm.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default VendorSupportPage;