import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Providers } from "@/lib/provider"
import { Toaster } from "sonner"
import { NextStep, NextStepProvider } from "nextstepjs"
import { CustomCard } from "@/components/ui/CustomCard"
import { Roboto } from "next/font/google"
import { steps } from "@/lib/steps"
import { Suspense } from "react"

const roboto = Roboto({
  weight: ["400", "700"], // choose weights you need
  subsets: ["latin"],
  variable: "--font-roboto",
})

export const metadata: Metadata = {
  title: "Nomadic Bookings - Desert Camping Experience",
  description: "Experience the ultimate desert camping adventure with Nomadic Bookings",
    generator: 'v0.app'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={roboto.variable}>
        <Suspense fallback={null}>
          <NextStepProvider>
            <NextStep steps={steps} cardComponent={CustomCard}>
              <Providers>{children}</Providers>
              <Toaster
  position="top-right"
  toastOptions={{
    classNames: {
      toast: "text-sm px-3 py-2 rounded-md", // smaller font and padding
      title: "text-sm font-medium",
      description: "text-xs text-gray-500",
    },
  }}
/>
              <Analytics />
            </NextStep>
          </NextStepProvider>
        </Suspense>
      </body>
    </html>
  )
}
