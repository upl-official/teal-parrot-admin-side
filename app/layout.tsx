import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Teal Parrot Admin Dashboard",
  description: "Admin dashboard for Teal Parrot e-commerce platform",
    generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="tealparrot-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
