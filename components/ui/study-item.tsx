"use client"

import type React from "react"
import { useState } from "react"
import { BookOpen, Star, MoreVertical, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface StudyProps {
  title: string
  subtitle: string
  id: string
  favoriteMap: Record<string, boolean>
  updateFavorite: (ids: string[], isFavorite: boolean) => void
  onClick: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function Study({
  title,
  subtitle,
  id,
  favoriteMap,
  updateFavorite,
  onClick,
  onEdit,
  onDelete,
}: StudyProps) {
  // const defaultSubtitle = dateAdded ? `Added ${new Date(dateAdded).toLocaleDateString()}` : "Recently studied"
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isFavorite = favoriteMap[id]
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      // Toggle favorite status for all this reference
      updateFavorite([id], isFavorite)
    } catch (error) {
      console.error("Failed to update favorite status:", error)
    }
  }
  
  const handleClick = (action: () => void) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsMenuOpen(false)
      action()
    }
  }
  
  return (
    <div
      key={title}
      className="flex items-center justify-between p-3 sm:p-4 bg-secondary border rounded-lg hover:bg-muted/50 active:bg-muted/70 cursor-pointer transition-colors touch-manipulation"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm sm:text-base truncate">{title}</div>
          <div className="text-xs text-wrap sm:text-sm text-muted-foreground truncate">{subtitle}</div>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
        {/* Favorite Button */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFavoriteClick}>
          <Star className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
          <span className="sr-only">Toggle favorite</span>
        </Button>

        {/* More Menu */}
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Study Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {onEdit && (
              <DropdownMenuItem onClick={handleClick(onEdit)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Reference
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            {onDelete && (
              <DropdownMenuItem
                onClick={handleClick(onDelete)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Study
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
  // return (
  //   <div
  //     className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
  //     onClick={onClick}
  //   >
  //     <div className="flex items-center gap-3">
  //       <BookOpen className="h-4 w-4 text-muted-foreground" />
  //       <div>
  //         <div className="font-medium">{formatReference(reference)}</div>
  //         <div className="text-sm text-muted-foreground">{subtitle || defaultSubtitle}</div>
  //       </div>
  //     </div>
  //     {showFavoriteButton && onToggleFavorite && (
  //       <Button
  //         variant="ghost"
  //         size="icon"
  //         onClick={(e) => {
  //           e.stopPropagation()
  //           onToggleFavorite()
  //         }}
  //       >
  //         <Star className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
  //       </Button>
  //     )}
  //     {!showFavoriteButton && <div className="text-muted-foreground">→</div>}
  //   </div>
  // )
}
