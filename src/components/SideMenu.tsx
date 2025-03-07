"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SideMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)} className="fixed top-4 left-4 z-50">
        <Menu className="h-6 w-6" />
      </Button>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)}>
          <div
            className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-4 right-4"
              >
                <X className="h-6 w-6" />
              </Button>
              <nav className="mt-8 space-y-4">
                <Link href="/" className="block py-2 text-lg font-medium hover:text-gray-900">
                  Outfit Generator
                </Link>
                <Link href="/add-clothes" className="block py-2 text-lg font-medium hover:text-gray-900">
                  Add Clothes
                </Link>
                <Link href="/profile" className="block py-2 text-lg font-medium hover:text-gray-900">
                  Profile
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

