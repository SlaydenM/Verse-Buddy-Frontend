"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, Mail, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface AuthModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: "signin" | "signup"
}

export function AuthModal({ isOpen, onOpenChange, defaultMode = "signin" }: AuthModalProps) {
  const router = useRouter()
  const [mode, setMode] = useState<"signin" | "signup" | "reset" | "check-email">(defaultMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const { signIn, signUp, resetPassword } = useAuth()
  
  const resetForm = () => {
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setDisplayName("")
    setError(null)
    setSuccess(null)
    setShowPassword(false)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)
    
    try {
      if (mode === "signin") {
        await signIn(email, password)
        onOpenChange(false)
        resetForm()
        console.log(`User signed in successfully`)
      } else if (mode === "signup") {
        if (password !== confirmPassword) {
          setError("Passwords do not match")
          return
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters")
          return
        }
        
        const result = await signUp(email, password, displayName)
        
        if (result.autoSignedIn) {
          // User was automatically signed in, close modal and redirect
          setSuccess("Account created and signed in successfully!")
          setTimeout(() => {
            onOpenChange(false)
            resetForm()
            router.push("/pages/studies")
          }, 1500)
        } else {
          // Email confirmation required, show check email screen
          setMode("check-email")
          setSuccess(null)
        }
      } else if (mode === "reset") {
        await resetPassword(email)
        setMode("check-email")
        setSuccess(null)
      }
    } catch (err) {
      console.error("Auth error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }
  
  const switchMode = (newMode: "signin" | "signup" | "reset") => {
    setMode(newMode)
    setError(null)
    setSuccess(null)
  }
  
  const getTitle = () => {
    switch (mode) {
      case "signin":
        return "Sign In"
      case "signup":
        return "Create Account"
      case "reset":
        return "Reset Password"
      case "check-email":
        return "Check Your Email"
    }
  }
  
  const getDescription = () => {
    switch (mode) {
      case "signin":
        return "Sign in to your Verse Buddy account"
      case "signup":
        return "Create a new Verse Buddy account"
      case "reset":
        return "Enter your email to reset your password"
      case "check-email":
        return "We've sent you an email with further instructions"
    }
  }
  
  // Check email screen
  if (mode === "check-email") {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              {getTitle()}
            </DialogTitle>
            <DialogDescription>{getDescription()}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-blue-500" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  We've sent an email to <strong>{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Click the link in the email to continue. The email may take a few minutes to arrive.
                </p>
              </div>
              
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Development Note:</strong> If you're not receiving emails, check your Supabase project
                  settings. In development, emails might not be sent automatically.
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setMode("signin")
                  setEmail("")
                }}
                className="w-full"
              >
                Back to Sign In
              </Button>
              
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter your email"
            />
          </div>
          
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name (Optional)</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
                placeholder="How should we call you?"
              />
            </div>
          )}
          
          {mode !== "reset" && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Enter your password"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
          
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Confirm your password"
                minLength={6}
              />
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "signin" && "Sign In"}
            {mode === "signup" && "Create Account"}
            {mode === "reset" && "Send Reset Email"}
          </Button>
          
          <div className="text-center space-y-2">
            {mode === "signin" && (
              <>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => switchMode("reset")}
                  disabled={isLoading}
                  className="text-sm"
                >
                  Forgot your password?
                </Button>
                <div className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => switchMode("signup")}
                    disabled={isLoading}
                    className="p-0 h-auto text-sm"
                  >
                    Sign up
                  </Button>
                </div>
              </>
            )}
            
            {mode === "signup" && (
              <div className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => switchMode("signin")}
                  disabled={isLoading}
                  className="p-0 h-auto text-sm"
                >
                  Sign in
                </Button>
              </div>
            )}
            
            {mode === "reset" && (
              <Button
                type="button"
                variant="link"
                onClick={() => switchMode("signin")}
                disabled={isLoading}
                className="text-sm"
              >
                Back to sign in
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
