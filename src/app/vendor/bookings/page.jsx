"use client";

import {useEffect, useState} from "react";
import {auth, firestore} from "@/context/Firebase";
import {onAuthStateChanged} from "firebase/auth";
import {
    collection, query, where, doc, getDoc, updateDoc, orderBy, onSnapshot,
} from "firebase/firestore";
import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
    CheckCircle, XCircle, User, Calendar, Search, ArrowUpDown, MapPin, Mail,
} from "lucide-react";
import Loading from "@/app/loading";
import {useToast} from "@/hooks/use-toast";
import {
    InputOTP, InputOTPGroup, InputOTPSlot,
} from "@/components/ui/input-otp";
import ProtectedRoute from "@/components/ProtectedRoute";
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';

const MapModal = dynamic(() => import('@/components/MapModal'), {
    ssr: false,
    loading: () => (
        <div className="h-64 flex items-center justify-center">
            <div className="text-center">
                <p className="text-lg font-medium">Loading map...</p>
            </div>
        </div>
    )
});
const VendorBookingPage = () => {
    const [bookings, setBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortOrder, setSortOrder] = useState("desc");
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const {toast} = useToast();

    const MapModal = dynamic(() => import('@/components/MapModal'), {
        ssr: false,
        loading: () => (
            <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg font-medium">Loading map...</p>
                </div>
            </div>
        )
    });
    // Fetch bookings from Firestore with real-time updates
    useEffect(() => {
        let unsubscribe;

        const fetchBookings = async (vendorId) => {
            try {
                const bookingsQuery = query(collection(firestore, "bookings"), where("vendorId", "==", vendorId), orderBy("date", sortOrder));

                unsubscribe = onSnapshot(bookingsQuery, async (querySnapshot) => {
                    const bookingsData = await Promise.all(querySnapshot.docs.map(async (bookingDoc) => {
                        const booking = bookingDoc.data();
                        const customerId = booking.userId;

                        let customerName = "Unknown";
                        let profileImage = "";
                        let email = "";
                        let customerLocation = null;
                        let address = "";

                        if (customerId) {
                            const customerRef = doc(firestore, "users", customerId);
                            const customerDoc = await getDoc(customerRef);
                            if (customerDoc.exists()) {
                                const customerData = customerDoc.data();
                                customerName = `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim();
                                profileImage = customerData.profileImage || "";
                                email = customerData.email || "";
                                customerLocation = customerData.location || null;
                                address = customerData.address || "";
                            }
                        }

                        return {
                            id: bookingDoc.id,
                            customerName,
                            profileImage,
                            service: booking.vendorService,
                            date: booking.date,
                            time: booking.time,
                            status: booking.status,
                            cancelReason: booking.cancelReason || "",
                            timestamp: booking.date,
                            email,
                            customerLocation,
                            address,
                        };
                    }));

                    setBookings(bookingsData);
                    setLoading(false);
                });
            } catch (error) {
                toast({
                    title: "Error Fetching Bookings", description: error.message, variant: "destructive",
                });
                setLoading(false);
            }
        };

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) fetchBookings(user.uid);
        });

        return () => {
            if (unsubscribe) unsubscribe();
            unsubscribeAuth();
        };
    }, [sortOrder, toast]);

    // Handle OTP timer
    useEffect(() => {
        let interval;
        if (otpTimer > 0) {
            interval = setInterval(() => {
                setOtpTimer((prev) => prev - 1);
            }, 1000);
        } else if (otpTimer === 0 && isOtpSent) {
            setIsOtpSent(false);
        }
        return () => clearInterval(interval);
    }, [otpTimer, isOtpSent]);

    // Send OTP to the user's email
    const sendOtp = async (email) => {
        if (!email) {
            toast({
                title: "Email is Required", description: "No email found for this booking.", variant: "destructive",
            });
            return;
        }

        try {
            const response = await fetch('/api/send-otp', {
                method: 'POST', headers: {
                    'Content-Type': 'application/json',
                }, body: JSON.stringify({email}),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send OTP');
            }

            setIsOtpSent(true);
            setOtpTimer(180);
            toast({
                title: "OTP Sent", description: "An OTP has been sent to the user's email.", variant: "success",
            });
        } catch (error) {
            toast({
                title: "Failed to Send OTP", description: error.message, variant: "destructive",
            });
        }
    };

    // Verify OTP and mark booking as complete
    const verifyOtpAndComplete = async () => {
        if (!selectedBooking) return;

        try {
            const response = await fetch('/api/verify-otp', {
                method: 'POST', headers: {
                    'Content-Type': 'application/json',
                }, body: JSON.stringify({
                    email: selectedBooking.email, otp
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to verify OTP');
            }

            // Mark booking as complete
            const bookingRef = doc(firestore, "bookings", selectedBooking.id);
            await updateDoc(bookingRef, {
                status: "completed", completedAt: new Date().toISOString(), isRated: false,
            });

            setBookings((prevBookings) => prevBookings.map((booking) => booking.id === selectedBooking.id ? {
                ...booking, status: "completed"
            } : booking));

            toast({
                title: "Booking Completed", description: "The booking has been marked as complete.", variant: "success",
            });

            setOtp("");
            setIsOtpSent(false);
            setIsOtpModalOpen(false);
        } catch (error) {
            toast({
                title: "OTP Verification Failed", description: error.message, variant: "destructive",
            });
        }
    };

    // Handle booking status changes
    const handleStatusChange = async (id, newStatus) => {
        try {
            const bookingRef = doc(firestore, "bookings", id);
            const bookingDoc = await getDoc(bookingRef);
            const bookingData = bookingDoc.data();

            await updateDoc(bookingRef, {status: newStatus});

            setBookings((prev) => prev.map((booking) => booking.id === id ? {...booking, status: newStatus} : booking));

            if (newStatus === "accepted") {
                const vendorRef = doc(firestore, "users", bookingData.vendorId);
                const vendorDoc = await getDoc(vendorRef);
                const vendorData = vendorDoc.data();

                const response = await fetch('/api/send-email', {
                    method: 'POST', headers: {
                        'Content-Type': 'application/json',
                    }, body: JSON.stringify({
                        to: bookingData.userEmail, subject: `Booking Accepted - ${vendorData.organizationName}`, html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Booking Accepted!</h2>
                <p>Your booking with ${vendorData.organizationName} has been accepted.</p>
                
                <h3 style="color: #4b5563;">Booking Details</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Service:</strong> ${bookingData.vendorService}</li>
                  <li><strong>Date:</strong> ${bookingData.date}</li>
                  <li><strong>Time:</strong> ${bookingData.time}</li>
                </ul>
                
                <h3 style="color: #4b5563;">Vendor Information</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Organization:</strong> ${vendorData.organizationName}</li>
                  <li><strong>Contact:</strong> ${vendorData.name}</li>
                  <li><strong>Phone:</strong> ${vendorData.mobile}</li>
                  <li><strong>Email:</strong> ${vendorData.email}</li>
                </ul>
              </div>
            `
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to send acceptance email');
                }

                toast({
                    title: "Booking Accepted",
                    description: "The booking has been accepted and user has been notified.",
                    variant: "success",
                });
            }
        } catch (error) {
            toast({
                title: "Error Updating Status", description: error.message, variant: "destructive",
            });
        }
    };

    // Handle booking cancellation
    const handleCancelBooking = async (id) => {
        try {
            const bookingRef = doc(firestore, "bookings", id);
            await updateDoc(bookingRef, {
                status: "cancelled", cancelReason,
            });

            setBookings((prev) => prev.map((booking) => booking.id === id ? {
                ...booking, status: "cancelled", cancelReason
            } : booking));
            setIsCancelModalOpen(false);
            setCancelReason("");
            toast({
                title: "Booking Cancelled", description: "The booking has been cancelled.", variant: "destructive",
            });
        } catch (error) {
            toast({
                title: "Failed to Cancel Booking", description: error.message, variant: "destructive",
            });
        }
    };

    // Status badge component
    const StatusBadge = ({status}) => {
        const statusColors = {
            booked: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
            accepted: "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100",
            completed: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
            cancelled: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
        };

        return (<span className={`px-2 py-1 rounded-full text-sm ${statusColors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>);
    };

    if (loading) return <Loading/>;

    return (<ProtectedRoute roleRequired={["vendor"]}>
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                📅 Bookings Management
            </h1>
            <Tabs defaultValue="new">
                <TabsList className="grid grid-cols-3 w-full bg-background">
                    <TabsTrigger
                        value="new"
                        className="data-[state=active]:bg-blue-500 rounded-[5px] data-[state=active]:text-white"
                    >
                        New ({bookings.filter((b) => b.status === "booked").length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="pending"
                        className="data-[state=active]:bg-blue-500 rounded-[5px] data-[state=active]:text-white"
                    >
                        Pending ({bookings.filter((b) => b.status === "accepted").length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="all"
                        className="data-[state=active]:bg-blue-500 rounded-[5px] data-[state=active]:text-white"
                    >
                        All ({bookings.length})
                    </TabsTrigger>
                </TabsList>
                <div className="my-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
                        <Input
                            placeholder="Search by name or service..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="border rounded-lg p-2 bg-white dark:bg-gray-800 dark:text-gray-100"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="booked">Booked</option>
                            <option value="accepted">Accepted</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <Button
                            variant="outline"
                            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                        >
                            <ArrowUpDown className="mr-2 h-4 w-4"/>
                            {sortOrder === "asc" ? "Oldest" : "Newest"}
                        </Button>
                    </div>
                </div>

                {/* New Bookings Tab */}
                <TabsContent value="new">
                    <div className="space-y-4">
                        {bookings
                            .filter((b) => b.status === "booked")
                            .map((booking) => (<Card
                                key={booking.id}
                                className="p-4 hover:shadow-lg transition-shadow"
                            >
                                <div
                                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            {booking.profileImage ? (<img
                                                src={booking.profileImage}
                                                alt={booking.customerName}
                                                className="w-8 h-8 rounded-full"
                                            />) : (<User className="w-8 h-8 text-gray-500"/>)}
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                {booking.customerName}
                                            </p>
                                            <StatusBadge status={booking.status}/>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-500"/>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {booking.date} at {booking.time}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleStatusChange(booking.id, "accepted")}
                                            className="bg-green-500 rounded-[3px] hover:bg-green-600"
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4"/> Accept
                                        </Button>
                                        <Button
                                            className="rounded-[3px]"
                                            variant="destructive"
                                            onClick={() => {
                                                setSelectedBooking(booking);
                                                setIsCancelModalOpen(true);
                                            }}
                                        >
                                            <XCircle className="mr-2 h-4 w-4"/> Cancel
                                        </Button>
                                    </div>
                                </div>
                            </Card>))}
                    </div>
                </TabsContent>

                {/* Pending Bookings Tab */}
                <TabsContent value="pending">
                    <div className="space-y-4">
                        {bookings
                            .filter((b) => b.status === "accepted")
                            .map((booking) => (<Card
                                key={booking.id}
                                className="p-4 hover:shadow-lg transition-shadow"
                            >
                                <div
                                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            {booking.profileImage ? (<img
                                                src={booking.profileImage}
                                                alt={booking.customerName}
                                                className="w-8 h-8 rounded-full"
                                            />) : (<User className="w-8 h-8 text-gray-500"/>)}
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                {booking.customerName}
                                            </p>
                                            <StatusBadge status={booking.status}/>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-500"/>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {booking.date} at {booking.time}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                setSelectedBooking(booking);
                                                setIsOtpModalOpen(true);
                                                if (!isOtpSent) {
                                                    sendOtp(booking.email);
                                                }
                                            }}
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-[3px] hover:from-blue-600 hover:to-purple-700 text-white"
                                        >
                                            <Mail className="mr-2 h-4 w-4"/> Send OTP & Complete
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (booking.customerLocation) {
                                                    setIsMapModalOpen(true);
                                                    setSelectedBooking({
                                                        location: booking.customerLocation,
                                                        address: booking.address || "Customer Location"
                                                    });
                                                } else {
                                                    toast({
                                                        title: "Location Not Available",
                                                        description: "Customer location data is not available.",
                                                        variant: "destructive",
                                                    });
                                                }
                                            }}
                                            variant="outline"
                                            className="ml-2"
                                        >
                                            <MapPin className="mr-2 h-4 w-4"/> View Location
                                        </Button>
                                    </div>
                                </div>
                            </Card>))}
                    </div>
                </TabsContent>

                {/* All Bookings Tab */}
                <TabsContent value="all">
                    <div className="space-y-4">
                        {bookings
                            .filter((booking) => {
                                if (filterStatus === "all") return true;
                                return booking.status === filterStatus;
                            })
                            .filter((booking) => booking.customerName
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase()) || booking.service
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase()))
                            .map((booking) => (<Card
                                key={booking.id}
                                className="p-4 hover:shadow-lg transition-shadow"
                            >
                                <div
                                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            {booking.profileImage ? (<img
                                                src={booking.profileImage}
                                                alt={booking.customerName}
                                                className="w-8 h-8 rounded-full"
                                            />) : (<User className="w-8 h-8 text-gray-500"/>)}
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                {booking.customerName}
                                            </p>
                                            <StatusBadge status={booking.status}/>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-500"/>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {booking.date} at {booking.time}
                                            </p>
                                        </div>
                                        {booking.cancelReason && (<p className="text-sm text-red-500">
                                            <strong>Cancel Reason:</strong>{" "}
                                            {booking.cancelReason}
                                        </p>)}
                                    </div>
                                    <div className="flex gap-2">
                                        {booking.status === "accepted" && (<>
                                            <Button
                                                onClick={() => {
                                                    setSelectedBooking(booking);
                                                    setIsOtpModalOpen(true);
                                                    if (!isOtpSent) {
                                                        sendOtp(booking.email);
                                                    }
                                                }}
                                                className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-[3px] hover:from-blue-600 hover:to-purple-700 text-white"
                                            >
                                                <Mail className="mr-2 h-4 w-4"/> Send OTP & Complete
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    if (booking.customerLocation) {
                                                        setIsMapModalOpen(true);
                                                        setSelectedBooking({
                                                            location: booking.customerLocation,
                                                            address: booking.address || "Customer Location"
                                                        });
                                                    } else {
                                                        toast({
                                                            title: "Location Not Available",
                                                            description: "Customer location data is not available.",
                                                            variant: "destructive",
                                                        });
                                                    }
                                                }}
                                                variant="outline"
                                                className="ml-2"
                                            >
                                                <MapPin className="mr-2 h-4 w-4"/> View Location
                                            </Button>
                                        </>)}
                                    </div>
                                </div>
                            </Card>))}
                    </div>
                </TabsContent>

                {/* OTP Verification Modal */}
                <Dialog open={isOtpModalOpen} onOpenChange={setIsOtpModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Enter OTP</DialogTitle>
                            <DialogDescription>
                                Please enter the 6-digit OTP sent to{" "}
                                {selectedBooking?.email || "the user's email"}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-center items-center">
                            <InputOTP
                                maxLength={6}
                                value={otp}
                                onChange={(value) => setOtp(value)}
                            >
                                <InputOTPGroup>
                                    {[...Array(6)].map((_, index) => (<InputOTPSlot key={index} index={index}/>))}
                                </InputOTPGroup>
                            </InputOTP>
                        </div>
                        <DialogFooter className="mt-4 flex gap-4">
                            <Button
                                onClick={verifyOtpAndComplete}
                                className="bg-green-500 hover:bg-green-600"
                                disabled={otp.length !== 6}
                            >
                                Verify OTP
                            </Button>
                            <Button
                                onClick={() => sendOtp(selectedBooking?.email)}
                                disabled={otpTimer > 0} className="bg-primary text-white "
                            >
                                {otpTimer > 0 ? `Resend OTP in ${Math.floor(otpTimer / 60)}:${otpTimer % 60 < 10 ? "0" : ""}${otpTimer % 60}` : "Resend OTP"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Cancel Booking Modal */}
                <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cancel Booking</DialogTitle>
                            <DialogDescription>
                                Please provide a reason for cancelling this booking.
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea
                            placeholder="Enter reason for cancellation..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                        <DialogFooter className="mt-4">
                            <Button
                                onClick={() => {
                                    handleCancelBooking(selectedBooking.id);
                                    setIsCancelModalOpen(false);
                                    setCancelReason("");
                                    setSelectedBooking(null);
                                }}
                                className="bg-red-500 hover:bg-red-600"
                                disabled={!cancelReason}
                            >
                                Confirm Cancellation
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsCancelModalOpen(false);
                                    setCancelReason("");
                                    setSelectedBooking(null);
                                }}
                                variant="outline"
                            >
                                Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Map Modal */}
                {isMapModalOpen && selectedBooking?.location && (
                    <MapModal
                        key={`map-modal-${selectedBooking.location.lat}-${selectedBooking.location.lng}-${Date.now()}`}
                        isOpen={isMapModalOpen}
                        onClose={() => setIsMapModalOpen(false)}
                        userLocation={selectedBooking.location}
                        destinationName={selectedBooking.address}
                    />
                )}
            </Tabs>
        </div>
    </ProtectedRoute>);
};

export default VendorBookingPage;
