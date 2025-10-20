"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error during auth callback:", error)
          router.push("/pages/login?error=callback_failed")
          return
        }

        if (session) {
          // Successfully authenticated, redirect to studies page
          router.push("/pages/studies")
        } else {
          // No session found, redirect to login
          router.push("/pages/login")
        }
      } catch (error) {
        console.error("Unexpected error during auth callback:", error)
        router.push("/pages/login?error=unexpected")
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
