"use client"

import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before accessing the theme (prevents hydration mismatch)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
      className="rounded-xl bg-white/80 dark:bg-gray-700 backdrop-blur-lg transition-all"
    >
      {resolvedTheme === "light" ? (
        <MoonIcon className="h-[1.2rem] w-[1.2rem] " />
      ) : (
        <SunIcon className="h-[1.2rem] w-[1.2rem] " />
      )}
    </Button>
  )
}
