import "./globals.css"
import {ThemeProvider} from "@/components/theme-provider"
import {Toaster} from "@/components/ui/toaster"
import 'leaflet/dist/leaflet.css';
import {Roboto, Open_Sans} from "next/font/google"
import PresenceTracker from "@/components/PresenceTracker";

const roboto = Roboto({
    weight: "400",
    subsets: ["latin"],
})
const openSans = Open_Sans({
    weight: "700",
    subsets: ["latin"],
})


export const metadata = {
    title: "Servify - Local Sercive Application",
    description:
        "Servify is a local service application that connects users with local service providers.",
    icons: "/logo.svg",
}

export default function RootLayout({children}) {
    return (
        <html lang="en">
        <body className={openSans.variable}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <PresenceTracker />
                <div className=" ">{children}</div>


        </ThemeProvider>
        <Toaster/>
        </body>
        </html>
    )
}
