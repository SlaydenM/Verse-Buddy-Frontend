"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { BibleReference, BibleVerse } from "@/types/bible"
import { formatReference } from "@/lib/bible-utils"
import { BookmarkPlus, Headphones, Share2 } from "lucide-react"

interface MemorizeViewProps {
  reference: BibleReference
  verses: BibleVerse[]
  onVerseRangeChange: (start: number, end: number) => void
}

export function MemorizeViewSimple({ reference, verses, onVerseRangeChange }: MemorizeViewProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isParagraphView, setIsParagraphView] = useState<boolean>(false)
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number }>({
    start: 1,
    end: verses.length,
  })
  const contentRef = useRef<HTMLDivElement>(null)

  // Update selected range when verses change
  useEffect(() => {
    setSelectedRange({ start: 1, end: verses.length })
    onVerseRangeChange(1, verses.length)
  }, [verses, onVerseRangeChange])

  const handleVerseClick = (verseNumber: number) => {
    // If clicking the same verse, select just that verse
    if (verseNumber === selectedRange.start && verseNumber === selectedRange.end) {
      return
    }

    // If no verse is selected yet, select this one
    if (selectedRange.start === 0 && selectedRange.end === 0) {
      setSelectedRange({ start: verseNumber, end: verseNumber })
      onVerseRangeChange(verseNumber, verseNumber)
      return
    }

    // If we already have a start verse but no end verse, set the end
    if (selectedRange.start > 0 && selectedRange.end === selectedRange.start) {
      // Make sure start is always less than or equal to end
      if (verseNumber < selectedRange.start) {
        setSelectedRange({ start: verseNumber, end: selectedRange.start })
        onVerseRangeChange(verseNumber, selectedRange.start)
      } else {
        setSelectedRange({ start: selectedRange.start, end: verseNumber })
        onVerseRangeChange(selectedRange.start, verseNumber)
      }
      return
    }

    // If we have both start and end, start over with this verse
    setSelectedRange({ start: verseNumber, end: verseNumber })
    onVerseRangeChange(verseNumber, verseNumber)
  }

  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying)
  }

  const handleShare = () => {
    console.log("Sharing:", formatReference(reference))
  }

  // If no verses, show a message
  if (verses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{reference ? formatReference(reference) : "No Scripture Selected"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No verses to display. Please select a scripture passage.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{formatReference(reference)}</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePlayAudio}>
            <Headphones className={`h-4 w-4 ${isPlaying ? "text-green-500" : ""}`} />
            <span className="sr-only">Play audio</span>
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share</span>
          </Button>
          <Button variant="outline" size="icon">
            <BookmarkPlus className="h-4 w-4" />
            <span className="sr-only">Save</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch id="paragraph-mode" checked={isParagraphView} onCheckedChange={setIsParagraphView} />
            <Label htmlFor="paragraph-mode">Paragraph View</Label>
          </div>
          <div className="text-sm text-muted-foreground">
            Selected: v{selectedRange.start}-v{selectedRange.end}
          </div>
        </div>

        <div ref={contentRef} className="relative select-none">
          {isParagraphView ? (
            <div className="prose dark:prose-invert max-w-none">
              <p className="mb-4">
                {verses.map((verse) => (
                  <span
                    key={verse.verse}
                    className={`verse-text ${
                      verse.verse >= selectedRange.start && verse.verse <= selectedRange.end ? "bg-primary/20" : ""
                    }`}
                    onClick={() => handleVerseClick(verse.verse)}
                  >
                    <span className="verse-number font-bold text-sm align-super mr-1">{verse.verse}</span>
                    {verse.text}{" "}
                  </span>
                ))}
              </p>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              {verses.map((verse) => (
                <p
                  key={verse.verse}
                  className={`mb-2 verse-text ${
                    verse.verse >= selectedRange.start && verse.verse <= selectedRange.end ? "bg-primary/20" : ""
                  }`}
                  onClick={() => handleVerseClick(verse.verse)}
                >
                  <span className="verse-number font-bold text-sm align-super mr-1">{verse.verse}</span>
                  {verse.text}
                </p>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
