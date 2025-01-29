"use client"
import { useState, useEffect } from "react"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Loading from "@/app/loading"

// Firebase imports
import { firestore, storage, auth } from "@/context/Firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { onAuthStateChanged } from "firebase/auth"
import { ModeToggle } from "@/components/ToggleTheme"

const Profile = () => {
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [userId, setUserId] = useState(null)
  const [imageError, setImageError] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    profileImage: "https://github.com/shadcn.png", // Default profile image
  })

  useEffect(() => {
    setIsClient(true)

    // Check if user is logged in
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid)
        await fetchUserData(user.uid)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Fetch user data from Firestore
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

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Handle Image Upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file || !userId) return

    try {
      const storageRef = ref(storage, `profileImages/${userId}`)
      setUploadingImage(true)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      // Update Firestore with the image URL
      await setDoc(
        doc(firestore, "users", userId),
        { profileImage: downloadURL },
        { merge: true }
      )

      setFormData((prev) => ({ ...prev, profileImage: downloadURL }))
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setUploadingImage(false)
    }
  }

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!userId) return

    // Validate form fields
    if (
      !formData.name ||
      !formData.mobile ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.country ||
      !formData.pincode
    ) {
      alert("Please fill in all fields.")
      return
    }

    // Split name into firstName and lastName
    const nameParts = formData.name.trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    try {
      await setDoc(
        doc(firestore, "users", userId),
        { ...formData, firstName, lastName },
        { merge: true }
      )
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    }
  }

  if (!isClient || loading) return <Loading />

  return (
    <div className="md:w-[70%] w-[95%] bg-[#eaeaea] rounded-md dark:bg-secondary mx-auto flex flex-col my-5 px-5 py-10 md:p-10">
      <div className="md:hidden border border-foreground rounded-md p-1 h-12 w-12  flex justify-center items-center">
        <ModeToggle />
      </div>
      <form onSubmit={handleSubmit}>
        {/* Profile Image with Loader */}
        <div className="relative w-24 h-24 rounded-full mx-auto bg-white overflow-hidden flex justify-center items-center">
          {uploadingImage ? (
            <div className="animate-pulse w-full h-full bg-gray-300  rounded-full" />
          ) : (
            <Avatar className="w-full h-full flex">
              <AvatarImage
                alt="User Profile"
                src={
                  imageError
                    ? "https://github.com/shadcn.png"
                    : formData.profileImage
                }
                onError={() => setImageError(true)}
              />
            </Avatar>
          )}
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleImageChange}
          />
        </div>

        {/* User Information */}
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
              type="tel"
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
        <Button className="text-white w-full  mt-10" type="submit">
          {" "}
          Submit{" "}
        </Button>
      </form>
    </div>
  )
}

export default Profile
