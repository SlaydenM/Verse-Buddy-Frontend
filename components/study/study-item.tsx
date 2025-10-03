"use client"

import { Button } from "@/components/ui/button"
import { BookOpen, Star } from "lucide-react"
import type { BibleReference } from "@/types/bible"
import { formatReference } from "@/lib/bible-utils"

interface StudyItemProps {
  id: string
  reference: BibleReference
  dateAdded?: string
  isFavorite?: boolean
  subtitle?: string
  onClick: () => void
  onToggleFavorite?: () => void
  showFavoriteButton?: boolean
}

export function StudyItem({
  id,
  reference,
  dateAdded,
  isFavorite = false,
  subtitle,
  onClick,
  onToggleFavorite,
  showFavoriteButton = true,
}: StudyItemProps) {
  const defaultSubtitle = dateAdded ? `Added ${new Date(dateAdded).toLocaleDateString()}` : "Recently studied"

  return (
    <div
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{formatReference(reference)}</div>
          <div className="text-sm text-muted-foreground">{subtitle || defaultSubtitle}</div>
        </div>
      </div>
      {showFavoriteButton && onToggleFavorite && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
        >
          <Star className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
        </Button>
      )}
      {!showFavoriteButton && <div className="text-muted-foreground">→</div>}
    </div>
  )
}
