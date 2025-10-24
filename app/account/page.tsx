"use client"

import { MainLayout } from "@/components/layouts/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Mail, User, Calendar, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AccountPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/pages/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return null
  }

  const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "User"
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Account Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage your account information and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} alt={displayName} />
                <AvatarFallback className="text-lg sm:text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-base sm:text-lg font-semibold">{displayName}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              {/*<div className="flex items-center gap-2 text-xs sm:text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono text-[10px] sm:text-xs">{user.id}</span>
              </div>*/}
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Member since:</span>
                <span className="font-medium">{createdAt}</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email verified:</span>
                <span className="font-medium">{user.email_confirmed_at ? "Yes" : "No"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Profile</CardTitle>
            <CardDescription>Change your display name and other profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-xs sm:text-sm">
                Display Name
              </Label>
              <Input
                id="displayName"
                placeholder="Enter your display name"
                defaultValue={displayName}
                className="text-sm"
              />
            </div>
            <Button disabled className="text-sm">
              Save Changes (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Update your password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-xs sm:text-sm">
                Current Password
              </Label>
              <Input id="currentPassword" type="password" placeholder="Enter current password" className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs sm:text-sm">
                New Password
              </Label>
              <Input id="newPassword" type="password" placeholder="Enter new password" className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">
                Confirm New Password
              </Label>
              <Input id="confirmPassword" type="password" placeholder="Confirm new password" className="text-sm" />
            </div>
            <Button disabled className="text-sm">
              Update Password (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your Verse Buddy experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Preference settings will be available in a future update. Stay tuned!
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible account actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Deleting your account will permanently remove all your studies, progress, and personal data. This action
              cannot be undone.
            </p>
            <Button variant="destructive" disabled className="text-sm">
              Delete Account (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
