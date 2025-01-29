import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

import { Roboto, Open_Sans, Lora } from "next/font/google"

const roboto = Roboto({
  weight: "400",
  subsets: ["latin"],
})
const openSans = Open_Sans({
  weight: "700",
  subsets: ["latin"],
})

const lora = Lora({
  weight: "400",
  subsets: ["latin"],
})

export const metadata = {
  title: "Servify - Local Sercive Application",
  description:
    "Servify is a local service application that connects users with local service providers.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={openSans.variable}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="mx-3 md:mx-16  ">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  )
}
