import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { NoIndexMetaTags } from "@/lib/security-utils"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Teal Parrot Admin Dashboard",
  description: "Admin dashboard for Teal Parrot e-commerce platform",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
    generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <NoIndexMetaTags />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="tealparrot-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
