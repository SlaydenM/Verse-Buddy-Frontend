import { Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-1 mb-2">
          Made with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> for Bible study
        </div>
        <p>© {new Date().getFullYear()} Verse Buddy. All rights reserved.</p>
      </div>
    </footer>
  )
}
