import "./globals.css"
import { Inter } from "next/font/google"
import type React from "react" // Import React

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Outfit Generator",
  description: "Generate your perfect outfit",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="stylesheet" href="url-to-cdn/splide.min.css"></link>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}

