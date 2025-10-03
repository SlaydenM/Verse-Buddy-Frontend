"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase" // CHANGE
import { apiClient } from "@/lib/api-client"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, displayName?: string) => Promise<{ autoSignedIn: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  updateProfile: (updates: { display_name?: string; avatar_url?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }
    
    getInitialSession()
    
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Handle automatic redirects based on auth state
      if (event === "SIGNED_IN" && session) {
        // Only redirect if user is on auth-related pages or home page
        const authPages = ["/", "/auth/callback", "/auth/reset-password"]
        const isOnAuthPage = authPages.some((page) => pathname === page || pathname.startsWith("/auth/"))
        
        if (isOnAuthPage) {
          router.push("/pages/studies")
        }
      } else if (event === "SIGNED_OUT") {
        // Redirect to home page when signed out
        const protectedPages = ["/pages", "/"]
        const isOnProtectedPage = protectedPages.some((page) => pathname.startsWith(page))
        
        if (isOnProtectedPage) {
          router.push("/")
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router, pathname])

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true)
    try {
      const result = await apiClient.signUp(email, password, displayName)
      return { autoSignedIn: (result as { autoSignedIn: boolean }).autoSignedIn }
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      await apiClient.signIn(email, password)
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await apiClient.signOut()
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    await apiClient.resetPassword(email)
  }

  const updatePassword = async (newPassword: string) => {
    await apiClient.updatePassword(newPassword)
  }

  const updateProfile = async (updates: { display_name?: string; avatar_url?: string }) => {
    await apiClient.updateProfile(updates)
    // Refresh user data
    try {
      const profileData = await apiClient.getProfile()
      // Assert the type of profileData to access user property safely
      setUser((profileData as { user: User | null }).user)
    } catch (error) {
      console.error("Error refreshing user profile:", error)
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
