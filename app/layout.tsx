import type React from "react"
import type { Metadata } from "next"
import { Merriweather } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

// Merriweather for body text (styled as sans in the design)
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
  variable: "--font-merriweather",
})

export const metadata: Metadata = {
  title: "Wikipedia - The Free Encyclopedia",
  description: "The free encyclopedia that anyone can edit",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${merriweather.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
