"use client"

import type React from "react"

import { apiClient } from "@/lib/api-client"
import { createContext, useContext, useEffect, useState } from "react"

interface AuthContextType {
  user: any | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  
  // const setUser = (newuser: any) => { 
  //   setUser1(newuser);
  //   console.log("USER CHANGED:", newuser)
  // }
  
  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true)
      try {
        const res = await apiClient.getCurrentUser()
        setUser(res.user ?? null)
      } catch (err) {
        console.error("Failed to fetch current user", err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [])
  
  const signUp = async (email: string, password: string) => {
    const res = await apiClient.signUp(email, password)
    if (res?.success && res.user) {
      setUser(res.user)
    }
    return res
  }
  
  const signIn = async (email: string, password: string) => {
    const res = await apiClient.signIn(email, password)
    if (res?.success && res.user) {
      setUser(res.user)
    }
    return res
  }
  
  const signOut = async () => {
    const res = await apiClient.signOut()
    if (res?.success) setUser(null)
    return res
  }
  
  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
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
