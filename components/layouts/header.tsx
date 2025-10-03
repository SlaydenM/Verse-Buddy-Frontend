"use client"

import { useState } from "react"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { Button } from "@/components/ui/button"
import { BookOpen, Menu, X, BarChart3, LogIn } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { UserMenu } from "@/components/auth/user-menu"
import { AuthModal } from "@/components/auth/auth-modal"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { user, loading } = useAuth()
  
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <span className="font-semibold text-xl">Verse Buddy</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:underline">
              Home
            </Link>
            {user && (
              <Link href="/pages/studies" className="text-sm font-medium hover:underline flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Studies
              </Link>
            )}
            <Link href="#" className="text-sm font-medium hover:underline">
              About
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline">
              Help
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ModeToggle />
            {!loading &&
              (user ? (
                <UserMenu />
              ) : (
                <Button onClick={() => setIsAuthModalOpen(true)} size="sm">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              ))}
          </div>
        </div>
        
        <div className="md:hidden flex items-center gap-2">
          <ModeToggle />
          {!loading && !user && (
            <Button onClick={() => setIsAuthModalOpen(true)} size="sm">
              <LogIn className="h-4 w-4" />
            </Button>
          )}
          {user && <UserMenu />}
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-3">
            <Link href="/" className="text-sm font-medium py-2 hover:underline" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            {user && (
              <Link
                href="/pages/studies"
                className="text-sm font-medium py-2 hover:underline flex items-center gap-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <BarChart3 className="h-4 w-4" />
                Studies
              </Link>
            )}
            <Link href="#" className="text-sm font-medium py-2 hover:underline" onClick={() => setIsMenuOpen(false)}>
              About
            </Link>
            <Link href="#" className="text-sm font-medium py-2 hover:underline" onClick={() => setIsMenuOpen(false)}>
              Help
            </Link>
            {!user && (
              <Button
                onClick={() => {
                  setIsAuthModalOpen(true)
                  setIsMenuOpen(false)
                }}
                className="mt-2"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </nav>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </header>
  )
}
