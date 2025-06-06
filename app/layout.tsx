import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import type { Metadata } from "next"
import localFont from 'next/font/local'

const inter = localFont({
  src: '../public/fonts/Inter-Regular.woff2',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "Joe 2.0",
  description: "Chat and interact with Joe, a seasoned expert and manage its knowledge base",
  generator: 'Rohit'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
