"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, firestore } from "@/context/Firebase";
import { getDoc, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { EyeNoneIcon, EyeOpenIcon } from "@radix-ui/react-icons";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Add global auth state listener for logout
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // User logged out, update presence status
        handleUserLogout();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUserLogout = async (userId) => {
    try {
      if (userId) {
        const userRef = doc(firestore, "users", userId);
        await updateDoc(userRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
      } else {
        navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                updated: serverTimestamp()
              });
            },
            (error) => {
              reject(error);
            }
        );
      }
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        throw new Error("Please verify your email before logging in");
      }

      // Get user's current location
      let locationData = null;
      try {
        locationData = await getCurrentLocation();
      } catch (locationError) {
        console.warn("Could not get user location:", locationError.message);
      }

      const userRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userRef);

      // Prepare base user data
      const userData = {
        email: user.email,
        lastLogin: serverTimestamp(),
        isOnline: true,
        lastActive: serverTimestamp(),
        lastSeen: serverTimestamp(),
        ...(locationData && { location: locationData }),
      };

      if (!userDoc.exists()) {
        // Get registration data from localStorage if exists
        const registrationData = localStorage.getItem("registrationData");
        const { firstName = "", lastName = "", role = "user", address = "" } =
            registrationData ? JSON.parse(registrationData) : {};

        // Create new user document
        await setDoc(userRef, {
          ...userData,
          firstName,
          lastName,
          role,
          address,
          createdAt: serverTimestamp(),
          emailVerified: user.emailVerified,
        });
      } else {
        // Update existing user document
        await updateDoc(userRef, {
          ...userData,
          emailVerified: user.emailVerified,
        });
      }

      // Get updated user data
      const updatedUserDoc = await getDoc(userRef);
      const userRole = updatedUserDoc.data()?.role || "user";

      // Redirect based on role
      const redirectPaths = {
        user: "/",
        vendor: "/vendor",
        admin: "/admin"
      };

      router.push(redirectPaths[userRole] || "/");

    } catch (error) {
      setError(error.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
      localStorage.removeItem("registrationData");
    }
  };

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
                      placeholder="Enter email"
                      className="dark:placeholder:text-white/50 rounded-[5px]"
                      type="email"
                      required
                  />
                </div>
                <div className="flex flex-col space-y-1.5 relative">
                  <Label htmlFor="password">Password</Label>
                  <Input
                      type={showPassword ? "text" : "password"}
                      onChange={(e) => setPassword(e.target.value)}
                      value={password}
                      id="password"
                      placeholder="Enter Password"
                      className="dark:placeholder:text-white/50 rounded-[5px]"
                      required
                      minLength="6"
                  />
                  <button
                      type="button"
                      className="absolute right-2 top-7"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeNoneIcon /> : <EyeOpenIcon />}
                  </button>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button
                    type="submit"
                    className="w-full text-white rounded-[5px]"
                    disabled={loading}
                >
                  {loading ? "Logging in..." : "Log In"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between flex-col">
            <p className="text-sm">
              Don't have an account?{" "}
              <Link className="text-base text-blue-600 hover:underline" href="/register">
                Register
              </Link>
            </p>
            <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:underline mt-2"
            >
              Forgot Password?
            </Link>
          </CardFooter>
        </Card>
      </div>
  );
};

export default LoginPage;
