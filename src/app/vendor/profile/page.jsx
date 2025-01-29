"use client"
import { useState, useEffect } from "react"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Loading from "@/app/loading"

// Firebase imports
import { firestore, storage, auth } from "@/context/Firebase"
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { onAuthStateChanged } from "firebase/auth"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ModeToggle } from "@/components/ToggleTheme"

const VendorProfile = () => {
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false) // Loader for form submission
  const [userId, setUserId] = useState(null)
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
  })

  useEffect(() => {
    setIsClient(true)

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid)
        await fetchUserData(user.uid)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const fetchUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(firestore, "users", uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        setFormData((prev) => ({
          ...prev,
          ...data,
          name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
        }))
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImageUpload = async (file, folder) => {
    try {
      const storageRef = ref(storage, `${folder}/${userId}/${file.name}`)
      await uploadBytes(storageRef, file)
      return await getDownloadURL(storageRef)
    } catch (error) {
      console.error(`Error uploading ${folder} image:`, error)
      return null
    }
  }

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0 || !userId) return

    setUploadingImage(true)

    try {
      const newImageUrls = await Promise.all(
        files.map((file) => handleImageUpload(file, "serviceImages"))
      )

      const filteredUrls = newImageUrls.filter((url) => url !== null)

      await setDoc(
        doc(firestore, "users", userId),
        { serviceImages: [...formData.serviceImages, ...filteredUrls] },
        { merge: true }
      )

      setFormData((prev) => ({
        ...prev,
        serviceImages: [...prev.serviceImages, ...filteredUrls],
      }))
    } catch (error) {
      console.error("Error uploading images:", error)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file || !userId) return

    setUploadingImage(true)

    try {
      const profileImageUrl = await handleImageUpload(file, "profileImages")

      if (profileImageUrl) {
        await setDoc(
          doc(firestore, "users", userId),
          { profileImage: profileImageUrl },
          { merge: true }
        )

        setFormData((prev) => ({ ...prev, profileImage: profileImageUrl }))
      }
    } catch (error) {
      console.error("Error uploading profile image:", error)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!userId) return

    setSubmitting(true)

    const nameParts = formData.name.trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    try {
      await setDoc(
        doc(firestore, "users", userId),
        {
          ...formData,
          firstName,
          lastName,
        },
        { merge: true }
      )
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setSubmitting(false)
    }
  }
  const [services, setServices] = useState([])

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "service"))
        const servicesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setServices(servicesData)
      } catch (error) {
        console.error("Error fetching services:", error)
      }
    }

    fetchServices()
  }, [])

  if (!isClient || loading) return <Loading />

  return (
    <div className="md:w-[70%] w-[95%] bg-[#eaeaea] rounded-md dark:bg-[#27272a] mx-auto flex flex-col my-5 p-5 md:p-10">
      <div className="md:hidden border border-foreground rounded-md p-1 h-12 w-12  flex justify-center items-center">
        <ModeToggle />
      </div>
      <form onSubmit={handleSubmit}>
        <div className="relative w-24 h-24 rounded-full mx-auto bg-white overflow-hidden flex justify-center items-center ">
          {uploadingImage ? (
            <div className="animate-pulse w-full h-full bg-gray-300 dark:bg-gray-700 rounded-full" />
          ) : (
            <Avatar className="w-full h-full flex">
              <AvatarImage alt="User Profile" src={formData.profileImage} />
            </Avatar>
          )}
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleProfileImageChange}
          />
        </div>

        <div className="h-[1px] my-10 w-full bg-white"></div>
        {/* User Information */}
        <h1 className="text-xl font-extrabold text-primary">
          Personal Details
        </h1>
        <div className="my-10 grid md:grid-cols-2 gap-x-10 gap-y-5">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter Full Name"
            />
          </div>
          <div className="space-y-2">
            <Label>Mobile Number</Label>
            <Input
              type="number"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Enter Mobile Number"
            />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter Address"
            />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter City"
            />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Enter State"
            />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Enter Country"
            />
          </div>
          <div className="space-y-2">
            <Label>Pincode</Label>
            <Input
              type="number"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="Enter Pincode"
            />
          </div>
        </div>
        <div className="h-[1px] my-10 w-full bg-white"></div>
        {/* Business Information */}
        <h1 className="text-xl font-extrabold text-primary">
          Organization Details
        </h1>
        <div className="my-10 flex flex-col md:grid md:grid-cols-2 gap-x-10 gap-y-5">
          <div className="space-y-2">
            <Label>Select Service</Label>
            <Select
              value={formData.service}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  service: value, // This will update the `service` field as an array of selected values
                })
              }}
              multiple
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup className="h-96 overflow-auto">
                  <SelectLabel className="border-b-2 mb-1 text-base font-bold">
                    Services
                  </SelectLabel>
                  {services.map((service) => (
                    <SelectItem
                      key={service.id}
                      value={service.name}
                    >
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Organization Name</Label>
            <Input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              placeholder="Enter Organization Name"
            />
          </div>
          <div className="space-y-2">
            <Label>Organization Address</Label>
            <Input
              type="text"
              name="organizationAddress"
              value={formData.organizationAddress}
              onChange={handleChange}
              placeholder="Enter Organization Address"
            />
          </div>
          <div className="space-y-2">
            <Label>Organization Contact Number</Label>
            <Input
              type="number"
              name="organizationMobileNumber"
              value={formData.organizationMobileNumber}
              onChange={handleChange}
              placeholder="Enter Organization Contact Number"
            />
          </div>
          <div className="space-y-2 ">
            <Label>About Your Service</Label>
            <Textarea
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell us about your service."
            />
          </div>
          <div className="space-y-2 ">
            <Label>About Your Company</Label>
            <Input
              type="text"
              name="availableTime"
              value={formData.availableTime}
              onChange={handleChange}
              placeholder="Enter Available Time"
            />
            
          </div>
          <div className="space-y-2 col-span-2">
            {/* Service Images Input Field */}
            <div className="my-5">
              <Label>Service Images</Label>
              <input
                type="file"
                accept="image/*"
                className="flex border-2 dark:border-white  rounded-md mt-2"
                onChange={handleImageChange}
                multiple
              />
              {formData.serviceImages.length > 0 && (
                <div className="mt-5">
                  <h3>Selected Images:</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {formData.serviceImages.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Service Image ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <Button className="w-full mt-10 text-white" type="submit">
          Update Profile
        </Button>
      </form>
    </div>
  )
}

export default VendorProfile
