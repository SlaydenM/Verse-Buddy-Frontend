import { MainLayout } from "@/components/layouts/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { BookOpen, HelpCircle, Lightbulb, MessageCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HelpPage() {
  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Help Center</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Find answers to common questions and learn how to use Verse Buddy
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-base sm:text-lg">Getting Started</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Learn the basics of creating studies and starting your memorization journey.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <CardTitle className="text-base sm:text-lg">Tips & Tricks</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Discover best practices for effective Scripture memorization.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-base sm:text-lg">Contact Support</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Need more help? Reach out to our support team for assistance.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-sm sm:text-base">How do I create a new study?</AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm">
                  To create a new study, go to your Studies page and click the "Create Study" button. You can then add
                  verses by searching for them by book, chapter, and verse. Give your study a name and start memorizing!
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-sm sm:text-base">What quiz types are available?</AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm">
                  Verse Buddy offers multiple quiz types including: Flashcards (flip to reveal), Type (type out the
                  verse), Match (match verse parts), Read (read and review), Reveal (progressive reveal), Speak (voice
                  input), Cloud (word cloud), and Phrase (fill in phrases).
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-sm sm:text-base">How do I track my progress?</AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm">
                  Your progress is automatically tracked as you complete quizzes. You can view statistics for each study
                  and verse, including accuracy rates, completion counts, and time spent studying.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-sm sm:text-base">Can I study offline?</AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm">
                  Currently, Verse Buddy requires an internet connection to sync your progress and access the full Bible
                  text. We're working on offline capabilities for future updates.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-sm sm:text-base">How do I add verses to favorites?</AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm">
                  When viewing a verse or study, click the heart icon to add it to your favorites. You can access all
                  your favorite verses from the Favorites section on your Studies page.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger className="text-sm sm:text-base">What Bible translation is used?</AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm">
                  Verse Buddy currently uses the King James Version (KJV) of the Bible. We're planning to add support
                  for additional translations in future updates.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memorization Tips</CardTitle>
            <CardDescription>Best practices for effective Scripture memorization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">1. Start Small</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Begin with shorter verses or passages. Build confidence before tackling longer chapters.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">2. Practice Daily</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Consistency is key. Even 5-10 minutes of daily practice is more effective than longer, sporadic
                sessions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">3. Use Multiple Methods</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Try different quiz types to engage different learning styles and keep your practice fresh.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">4. Review Regularly</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Revisit verses you've already memorized to maintain long-term retention.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm sm:text-base">
              If you couldn't find the answer you're looking for, we're here to help!
            </p>
            <Button variant="outline" asChild>
              <Link href="/about">Learn More About Us</Link>
            </Button>
            {/*<div className="flex flex-col sm:flex-row gap-2">
              <Button asChild>
                <Link href="mailto:support@versebuddy.com">Contact Support</Link>
              </Button>
            </div>*/}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
