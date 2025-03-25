"use client"
import { useState, useEffect } from "react"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast" // Import shadcn toast
import Loading from "@/app/loading"
import { ModeToggle } from "@/components/ToggleTheme"
import {
  FiCamera,
  FiUser,
  FiPhone,
  FiMap,
  FiMapPin,
  FiGlobe,
  FiFlag,
  FiHash,
  FiCheck,
  FiUploadCloud,
} from "react-icons/fi"
import { motion } from "framer-motion"

// Firebase imports
import { firestore, storage, auth } from "@/context/Firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { onAuthStateChanged } from "firebase/auth"

const AdminProfile = () => {
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [userId, setUserId] = useState(null)
  const [initialFormData, setInitialFormData] = useState(null)

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    profileImage: "https://github.com/shadcn.png",
  })

  const { toast } = useToast() // Initialize shadcn toast

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
        const formattedData = {
          ...data,
          name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
        }
        setFormData(formattedData)
        setInitialFormData(formattedData)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === "mobile") {
      const sanitizedValue = value.replace(/\D/g, "").slice(0, 10)
      setFormData(prev => ({ ...prev, [name]: sanitizedValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file || !userId) return

    try {
      const storageRef = ref(storage, `profileImages/${userId}`)
      setUploadingImage(true)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      await setDoc(
        doc(firestore, "users", userId),
        { profileImage: downloadURL },
        { merge: true }
      )

      setFormData(prev => ({ ...prev, profileImage: downloadURL }))
      toast({
        title: "Image Uploaded",
        description: "Profile image updated successfully",
        variant: "default",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!userId) return

    // Check required fields
    const requiredFields = ["name", "mobile", "address", "city", "state", "country", "pincode"]
    if (requiredFields.some(field => !formData[field])) {
      toast({
        title: "Form Incomplete",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // Mobile validation
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      toast({
        title: "Invalid Mobile",
        description: "Mobile number must start with 6-9 and be 10 digits",
        variant: "destructive",
      })
      return
    }

    // Check for changes
    if (JSON.stringify(formData) === JSON.stringify(initialFormData)) {
      toast({
        title: "No Changes",
        description: "No changes were made to the profile",
        variant: "info",
      })
      return
    }

    const nameParts = formData.name.trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    try {
      await setDoc(
        doc(firestore, "users", userId),
        { ...formData, firstName, lastName },
        { merge: true }
      )
      setInitialFormData(formData)
      toast({
        title: "Profile Updated",
        description: "Changes saved successfully",
        variant: "success",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update Failed",
        description: "Failed to save changes",
        variant: "destructive",
      })
    }
  }

  if (!isClient || loading) return <Loading />

  return (
    <div className="min-h-screen bg-background mb-16 md:mb-0 md:py-12 px-4 py-5 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-card rounded-2xl shadow-xl border"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Admin Profile
          </h1>
          <div className="block md:hidden">
            <ModeToggle />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
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
                        <FiUploadCloud className="w-8 h-8 animate-pulse" />
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
                onChange={handleImageChange}
                disabled={uploadingImage}
              />
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { label: "Name", name: "name", icon: <FiUser />, type: "text" },
              { label: "Mobile Number", name: "mobile", icon: <FiPhone />, type: "text" },
              { label: "Address", name: "address", icon: <FiMapPin />, type: "text" },
              { label: "City", name: "city", icon: <FiMap />, type: "text" },
              { label: "State", name: "state", icon: <FiGlobe />, type: "text" },
              { label: "Country", name: "country", icon: <FiFlag />, type: "text" },
              { label: "Pincode", name: "pincode", icon: <FiHash />, type: "text" },
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
                  type={field.type}
                  className="h-12 rounded-[5px] bg-background border-input focus:ring-2 focus:ring-primary/50"
                  placeholder={`Enter ${field.label}`}
                  inputMode={["mobile", "pincode"].includes(field.name) ? "numeric" : "text"}
                />
              </motion.div>
            ))}
          </div>

          <motion.div
            className="flex justify-end"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type="submit"
              className="h-12 w-full px-8 rounded-[5px] bg-primary text-primary-foreground font-semibold gap-2"
              disabled={uploadingImage}
            >
              <FiCheck className="w-5 h-5" />
              Update Profile
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}

export default AdminProfile