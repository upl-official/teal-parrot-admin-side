"use client"

import { useState } from "react"
import { Heart } from "lucide-react"

export default function Footer() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col md:flex-row items-center justify-between py-4 px-4 md:px-6">
        <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
          <p className="text-sm text-muted-foreground">&copy; {currentYear} TealParrot. All rights reserved.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Made with <Heart className="inline h-3 w-3 text-red-500 mx-1" /> by Brandsthink
          </p>
        </div>
      </div>
    </footer>
  )
}
