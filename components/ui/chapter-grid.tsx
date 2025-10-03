"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Loader2, ChevronDown } from "lucide-react"

interface ChapterGridProps {
  chapterCount: number
  selectedChapter: number
  onChapterSelect: (chapter: number) => void
  isExpanded: boolean
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  disabled?: boolean
}

export function ChapterGrid({ chapterCount, selectedChapter, onChapterSelect, isExpanded, setIsExpanded, disabled = false }: ChapterGridProps) {
  //const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate grid dimensions
  const columns = 5
  const rows = Math.ceil(chapterCount / columns)

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isExpanded])

  // Generate chapter grid
  const renderChapters = () => {
    const chapters = []

    for (let i = 1; i <= chapterCount; i++) {
      chapters.push(
        <button
          key={i}
          className={cn(
            "flex items-center justify-center p-2 rounded-md transition-colors",
            selectedChapter === i ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          onClick={() => {
            if (!disabled) {
              onChapterSelect(i)
              setIsExpanded(false)
            }
          }}
          disabled={disabled}
        >
          {i}
        </button>,
      )
    }

    return chapters
  }

  const toggleExpanded = () => {
    if (!disabled) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", disabled && "opacity-70 cursor-not-allowed")}>
      <div
        className={cn(
          "flex items-center justify-between border rounded-md p-2",
          !disabled && "cursor-pointer",
          isExpanded && !disabled && "border-primary",
        )}
        onClick={toggleExpanded}
      >
        <div className="font-medium">
          {disabled && chapterCount === 0 ? "Select a book first" : `Chapter ${selectedChapter}`}
        </div>
        {disabled && chapterCount > 0 ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "transform rotate-180")} />
        )}
      </div>

      {isExpanded && !disabled && (
        <div
          className={cn(
            "absolute left-0 right-0 z-50 bg-background border rounded-md shadow-lg mt-1 p-2 transition-all",
            "opacity-100 translate-y-0",
          )}
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            width: "100%",
          }}
        >
          <div className="grid grid-cols-5 gap-1" style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
            {renderChapters()}
          </div>
        </div>
      )}
    </div>
  )
}
