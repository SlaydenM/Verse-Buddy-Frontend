import { MainLayout } from "@/components/layouts/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Heart, Users, Zap } from "lucide-react"

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">About Verse Buddy</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Your companion for memorizing and studying Scripture
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm sm:text-base">
              Verse Buddy is designed to help you memorize and internalize Scripture through interactive study methods
              and engaging quiz formats. We believe that hiding God's Word in your heart transforms lives, and we're
              here to make that journey easier and more enjoyable.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-base sm:text-lg">Interactive Learning</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Multiple quiz types including flashcards, typing, matching, and more to keep your study engaging and
                effective.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-base sm:text-lg">Track Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Monitor your memorization journey with detailed statistics and progress tracking for each verse and
                study.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <CardTitle className="text-base sm:text-lg">Personalized Studies</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Create custom study collections with your favorite verses, organized by topic, book, or personal
                preference.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-base sm:text-lg">Community Driven</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Built with feedback from Scripture memorizers like you, constantly improving to serve your needs better.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Our Story</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm sm:text-base">
              Verse Buddy was created out of a passion for Scripture memorization and a desire to make it accessible to
              everyone. We understand the challenges of maintaining a consistent memorization practice, and we've built
              tools to help you overcome them.
            </p>
            <p className="text-sm sm:text-base">
              Whether you're memorizing a single verse or entire chapters, Verse Buddy adapts to your pace and learning
              style, making Scripture memorization a rewarding part of your daily routine.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
