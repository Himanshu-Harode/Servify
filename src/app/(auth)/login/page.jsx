  "use client"
  import { useState, useEffect } from "react"
  import { useRouter } from "next/navigation"
  import { signInWithEmailAndPassword } from "firebase/auth"
  import { auth, firestore } from "@/context/Firebase"
  import { getDoc, doc, setDoc } from "firebase/firestore"
  import { Button } from "@/components/ui/button"
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
  import Link from "next/link"
  import { EyeNoneIcon, EyeOpenIcon } from "@radix-ui/react-icons"

  const LoginPage = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const handleLogin = async (e) => {
      e.preventDefault() 
      setError("") // Reset error on each submit

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        if (user.emailVerified) {
          const registrationData = localStorage.getItem("registrationData")
          const {
            firstName = "",
            lastName = "",
            role = "",
            address = "",
          } = registrationData ? JSON.parse(registrationData) : {}

          // Check if user exists in Firestore
          const userDoc = await getDoc(doc(firestore, "users", user.uid))
          if (!userDoc.exists()) {
            // Save user data to Firestore after email verification
            await setDoc(doc(firestore, "users", user.uid), {
              firstName,
              lastName,
              email: user.email,
              role,
              address,
            })
          }

          // Assuming you save user role in Firestore, fetch it before routing
          const userData = userDoc.exists() ? userDoc.data() : {}
          const userRole = userData.role || role  // Check role from Firestore or registration data

          if (userRole === "user") {
            router.push("/");
          } else if (userRole === "vendor") {
            router.push("/vendor");
          } else if (userRole === "admin") {
            router.push("/admin");
          } else {
            setError("Invalid role assigned");
          }
        } else {
          setError("Please verify your email before logging in");
        }
      } catch (error) {
        setError(error.message || "An unknown error occurred while logging in");
      }
    }

    return (
      <div className="flex items-center justify-center h-screen px-3">
        <Card className="w-[400px] rounded-xl border-2 ">
          <CardHeader className="space-y-2 text-center">
            <CardTitle>Login</CardTitle>
            <CardDescription>Sign in to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="Email">Email</Label>
                  <Input
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    id="Email"
                    placeholder="Enter email" className="dark:placeholder:text-white/50 rounded-[5px] "
                  />
                </div>
                <div className="flex flex-col space-y-1.5 relative">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    id="password"
                    placeholder="Enter Password" className="dark:placeholder:text-white/50 rounded-[5px]"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-7"
                    onClick={() => setShowPassword(!showPassword)} 
                  >
                    {showPassword ? <EyeNoneIcon /> : <EyeOpenIcon />}
                  </button>
                </div>

                {error && <p className="text-red-500">{error}</p>}
                <Button className="w-full text-white rounded-[5px]">Log In</Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between flex-col">
            <p className="text-sm">
              Don't have an account?{" "}
              <Link className="text-base text-blue-600 " href={"register"}>
                Register
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  export default LoginPage
