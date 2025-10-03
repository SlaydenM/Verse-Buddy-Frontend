"use client"

import type React from "react"
import { Header } from "@/components/layouts/header"
import { Footer } from "@/components/layouts/footer"

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
      <Footer />
    </div>
  )
}
