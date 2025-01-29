"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth"
import { auth } from "@/context/Firebase"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { EyeNoneIcon, EyeOpenIcon } from "@radix-ui/react-icons"

const RegisterPage = () => {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchCurrentLocation = async () => {
      setIsFetchingLocation(true)
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords
              const location = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              )
              const locationData = await location.json()
              const userAddress =
                locationData.display_name || "Address not found"
              setAddress(userAddress)
            },
            (error) => {
              setError(
                "Unable to fetch location. Please allow location access."
              )
              setAddress("")
            }
          )
        } else {
          setError("Geolocation is not supported by this browser.")
        }
      } catch (err) {
        setError("An error occurred while fetching the location.")
      } finally {
        setIsFetchingLocation(false)
      }
    }

    fetchCurrentLocation()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      const user = userCredential.user
      await sendEmailVerification(user)

      localStorage.setItem(
        "registrationData",
        JSON.stringify({ firstName, lastName, email, role, address })
      )

      setMessage(
        "Registration successful. Please check your email for verification."
      )

      setFirstName("")
      setLastName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setRole("")
      setAddress("")
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen ">
      <Card className="">
        <CardHeader className="space-y-2 text-center">
          <CardTitle>Register</CardTitle>
          <CardDescription>Sign up to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="">
                    <Label htmlFor="Firstname">Firstname</Label>
                    <Input
                      onChange={(e) => setFirstName(e.target.value)}
                      value={firstName}
                      id="Firstname"
                      placeholder="Enter Firstname"
                    />
                  </div>
                  <div className="">
                    <Label htmlFor="Lastname">Lastname</Label>
                    <Input
                      onChange={(e) => setLastName(e.target.value)}
                      value={lastName}
                      id="Lastname"
                      placeholder="Enter Lastname"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-1.5 w-full">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="">
                    <Label htmlFor="role">Choose Your Role</Label>
                    <Select
                      onValueChange={(e) => setRole(e)}
                      id="role"
                      value={role}
                    >
                      <SelectTrigger className="">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="">
                    <Label htmlFor="Address">Address</Label>
                    <Input
                      value={address}
                      id="Address"
                      disabled
                      placeholder={
                        isFetchingLocation
                          ? "Fetching your location..."
                          : "Address will be auto-filled"
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="Email">Email</Label>
                <Input
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  id="Email"
                  placeholder="Enter Email"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Label htmlFor="Password">Password</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      onChange={(e) => setPassword(e.target.value)}
                      value={password}
                      id="Password"
                      placeholder="Enter Password"
                    />
                    <button
                      type="button"
                      className="absolute right-2 bottom-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeNoneIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                  <div className="relative">
                    <Label htmlFor="ConfirmPassword">Confirm Password</Label>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      value={confirmPassword}
                      id="ConfirmPassword"
                      placeholder="Enter Password"
                    />
                    <button
                      type="button"
                      className="absolute right-2 bottom-3"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? <EyeNoneIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                </div>
              </div>
              {error && <p className="text-red-500">{error}</p>}
              {message && <p className="text-green-500">{message}</p>}
              <Button className="w-full text-white">Create Account</Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between flex-col">
          <p className="text-sm">
            Already have an account?{" "}
            <Link className="text-base text-blue-600" href={"login"}>
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
export default RegisterPage
