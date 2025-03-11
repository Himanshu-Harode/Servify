"use client";
import { useState, useEffect } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast"; // Import shadcn toast
import Loading from "@/app/loading";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModeToggle } from "@/components/ToggleTheme";
import {
  FiCamera,
  FiUploadCloud,
  FiCheck,
  FiClock,
  FiInfo,
  FiBriefcase,
  FiMapPin,
  FiPhone,
  FiUser,
  FiTrash,
} from "react-icons/fi";
import { motion } from "framer-motion";

// Firebase imports
import { firestore, storage, auth } from "@/context/Firebase";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import ProtectedRoute from "@/components/ProtectedRoute";

const VendorProfile = () => {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);
  const [services, setServices] = useState([]);
  const [initialFormData, setInitialFormData] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    profileImage: "https://github.com/shadcn.png",
    service: [],
    description: "",
    availableTime: "",
    organizationName: "",
    organizationAddress: "",
    organizationMobileNumber: "",
    serviceImages: [],
  });

  const { toast } = useToast(); // Initialize shadcn toast

  useEffect(() => {
    setIsClient(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await fetchUserData(user.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(firestore, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const formattedData = {
          ...data,
          name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
        };
        setFormData(formattedData);
        setInitialFormData(formattedData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile" || name === "organizationMobileNumber") {
      const sanitizedValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (file, folder) => {
    try {
      const storageRef = ref(
        storage,
        `${folder}/${userId}/${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error(`Error uploading ${folder} image:`, error);
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${folder} image`,
        variant: "destructive",
      });
      return null;
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !userId) return;

    setUploadingImage(true);
    try {
      const newImageUrls = await Promise.all(
        files.map((file) => handleImageUpload(file, "serviceImages"))
      );
      const filteredUrls = newImageUrls.filter((url) => url !== null);

      await setDoc(
        doc(firestore, "users", userId),
        { serviceImages: [...formData.serviceImages, ...filteredUrls] },
        { merge: true }
      );

      setFormData((prev) => ({
        ...prev,
        serviceImages: [...prev.serviceImages, ...filteredUrls],
      }));
    } catch (error) {
      console.error("Error uploading images:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async (imageUrl) => {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);

      const updatedImages = formData.serviceImages.filter(
        (img) => img !== imageUrl
      );
      await setDoc(
        doc(firestore, "users", userId),
        { serviceImages: updatedImages },
        { merge: true }
      );

      setFormData((prev) => ({
        ...prev,
        serviceImages: updatedImages,
      }));

      toast({
        title: "Image Removed",
        description: "Service image removed successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error removing image:", error);
      toast({
        title: "Remove Failed",
        description: "Failed to remove service image",
        variant: "destructive",
      });
    }
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !userId) return;

    setUploadingImage(true);
    try {
      const profileImageUrl = await handleImageUpload(file, "profileImages");
      if (profileImageUrl) {
        await setDoc(
          doc(firestore, "users", userId),
          { profileImage: profileImageUrl },
          { merge: true }
        );
        setFormData((prev) => ({ ...prev, profileImage: profileImageUrl }));
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    const mobileRegex = /^[6-9]\d{9}$/;
    const requiredFields = [
      "name",
      "mobile",
      "address",
      "city",
      "state",
      "country",
      "pincode",
      "service",
      "description",
      "availableTime",
      "organizationName",
      "organizationAddress",
      "organizationMobileNumber",
    ];

    const missingFields = requiredFields.filter((field) => !formData[field]);
    if (missingFields.length > 0) {
      toast({
        title: "Missing Fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return false;
    }

    if (!mobileRegex.test(formData.mobile)) {
      toast({
        title: "Invalid Mobile",
        description: "Personal mobile number is invalid",
        variant: "destructive",
      });
      return false;
    }

    if (!mobileRegex.test(formData.organizationMobileNumber)) {
      toast({
        title: "Invalid Mobile",
        description: "Organization mobile number is invalid",
        variant: "destructive",
      });
      return false;
    }

    if (JSON.stringify(formData) === JSON.stringify(initialFormData)) {
      toast({
        title: "No Changes",
        description: "No changes were made to the profile",
        variant: "info",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !validateForm()) {
      return;
    }

    setSubmitting(true);
    const nameParts = formData.name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    try {
      await setDoc(
        doc(firestore, "users", userId),
        { ...formData, firstName, lastName },
        { merge: true }
      );
      setInitialFormData(formData);
      toast({
        title: "Profile Updated",
        description: "Vendor profile updated successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update vendor profile",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "service"));
        const servicesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setServices(servicesData);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    fetchServices();
  }, []);

  if (!isClient || loading) return <Loading />;

  return (
    <ProtectedRoute roleRequired={["vendor"]}>
      <div className="min-h-screen bg-background md:py-12 px-4 py-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto bg-card rounded-2xl shadow-xl border"
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Vendor Profile
            </h1>
            <div className="block md:hidden">
              <ModeToggle />
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-4 md:p-6 space-y-6 md:space-y-8"
          >
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
            >
              <div className="relative group">
                <div className="relative w-32 h-32 rounded-full bg-accent p-1 shadow-lg">
                  <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-background">
                    {uploadingImage ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="text-primary"
                        >
                          <FiUploadCloud size={36} />
                        </motion.div>
                      </div>
                    ) : (
                      <Avatar className="w-full h-full">
                        <AvatarImage
                          src={formData.profileImage}
                          className="object-cover"
                        />
                      </Avatar>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-background p-2 rounded-full shadow-sm border">
                    <FiCamera className="w-5 h-5 text-foreground" />
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleProfileImageChange}
                />
              </div>
            </motion.div>

            <div className="space-y-6 md:space-y-8">
              {/* Personal Details Section */}
              <motion.div className="border-b pb-6">
                <h2 className="text-lg md:text-xl font-bold text-primary mb-4 md:mb-6 flex items-center gap-2">
                  <FiUser className="w-4 h-4 md:w-5 md:h-5" />
                  Personal Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {[
                    { label: "Name", name: "name", icon: <FiUser /> },
                    {
                      label: "Mobile Number",
                      name: "mobile",
                      icon: <FiPhone />,
                      type: "tel",
                    },
                    { label: "Address", name: "address", icon: <FiMapPin /> },
                    { label: "City", name: "city" },
                    { label: "State", name: "state" },
                    { label: "Country", name: "country" },
                    { label: "Pincode", name: "pincode", type: "number" },
                  ].map((field, index) => (
                    <motion.div
                      key={field.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                        {field.icon}
                        {field.label}
                      </Label>
                      <Input
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        className="h-12 rounded-[5px] bg-background border-input focus:ring-2 focus:ring-primary/50"
                        placeholder={`Enter ${field.label}`}
                        type={field.type || "text"}
                        inputMode={
                          field.name === "mobile" ? "numeric" : "text"
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Organization Details Section */}
              <motion.div className="border-b pb-6">
                <h2 className="text-lg md:text-xl font-bold text-primary mb-4 md:mb-6 flex items-center gap-2">
                  <FiBriefcase className="w-4 h-4 md:w-5 md:h-5" />
                  Organization Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2 col-span-2">
                    <Label className="flex items-center gap-2">
                      <FiInfo />
                      Service Category
                    </Label>
                    <Select
                      value={formData.service}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, service: value }))
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select Services" />
                      </SelectTrigger>
                      <SelectContent className="max-h-96 bg-background border">
                        <SelectGroup>
                          <SelectLabel className="text-base font-semibold bg-accent p-2">
                            Available Services
                          </SelectLabel>
                          {services.map((service) => (
                            <SelectItem
                              key={service.id}
                              value={service.name}
                              className="hover:bg-accent text-foreground"
                            >
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {[
                    { label: "Organization Name", name: "organizationName" },
                    {
                      label: "Organization Address",
                      name: "organizationAddress",
                    },
                    {
                      label: "Contact Number",
                      name: "organizationMobileNumber",
                      type: "tel",
                    },
                    {
                      label: "Available Time",
                      name: "availableTime",
                      icon: <FiClock />,
                    },
                  ].map((field, index) => (
                    <motion.div
                      key={field.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2 col-span-2 md:col-span-1 mb-5"
                    >
                      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                        {field.icon}
                        {field.label}
                      </Label>
                      <Input
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        className="h-12 rounded-[5px] bg-background border-input focus:ring-2 focus:ring-primary/50"
                        placeholder={`Enter ${field.label}`}
                        type={field.type || "text"}
                        inputMode={
                          field.name === "organizationMobileNumber"
                            ? "numeric"
                            : "text"
                        }
                      />
                    </motion.div>
                  ))}

                  <motion.div
                    className="space-y-2 col-span-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Label className="flex items-center gap-2">
                      <FiInfo />
                      Service Description
                    </Label>
                    <Textarea
                      rows={6}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="min-h-[150px] bg-background border-input focus:ring-2 focus:ring-primary/50"
                      placeholder="Describe your services in detail..."
                    />
                  </motion.div>

                  <motion.div
                    className="space-y-2 col-span-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Label className="flex items-center gap-2">
                      <FiCamera />
                      Service Images
                    </Label>
                    <div className="border-2 border-dashed border-input rounded-lg p-4">
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full"
                        onChange={handleImageChange}
                        multiple
                        disabled={uploadingImage}
                      />
                      {formData.serviceImages.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
                          {formData.serviceImages.map((image, index) => (
                            <motion.div
                              key={index}
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              className="relative group"
                            >
                              <img
                                src={image}
                                alt={`Service ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(image)}
                                className="absolute top-1 right-1 p-1 bg-destructive rounded-full hover:bg-destructive/90 transition-colors"
                              >
                                <FiTrash className="w-4 h-4 text-white" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="flex justify-end"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                className="h-12 w-full md:w-auto px-8 rounded-[5px] bg-primary text-primary-foreground font-semibold gap-2"
                disabled={uploadingImage || submitting}
              >
                <FiCheck className="w-5 h-5" />
                {submitting ? "Updating..." : "Update Profile"}
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
};

export default VendorProfile;