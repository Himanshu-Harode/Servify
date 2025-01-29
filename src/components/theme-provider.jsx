"use client"


import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useEffect, useState } from "react"
import { Skeleton } from "./ui/skeleton"

export function ThemeProvider({ children, ...props }) {
  const [isLoaded, setIsLoaded] = useState(false)
  useEffect(() => {
    setIsLoaded(true)
  }, [])
  if (!isLoaded) {
    return <Skeleton className="w-full h-full rounded-full" />
  }
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
