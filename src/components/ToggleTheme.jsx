"use client"

import { useState, useEffect } from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme("system")
  const [currentTheme, setCurrentTheme] = useState("")

  useEffect(() => {
    // Set the initial theme to "system" by default
    setCurrentTheme(theme)
  }, [ theme])

  const toggleTheme = () => {
    if (currentTheme === "light") {
      setTheme("dark")
      setCurrentTheme("dark")
    } else {
      setTheme("light")
      setCurrentTheme("light")
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {currentTheme === "light" ? (
        <MoonIcon className="h-[1.2rem] w-[1.2rem] " />
      ) : (
        <SunIcon className="h-[1.2rem] w-[1.2rem]" />
      )}
    </Button>
  )
}
