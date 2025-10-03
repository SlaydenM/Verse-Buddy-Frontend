"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
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

export function MemorizeView({ reference, verses, onVerseRangeChange }: MemorizeViewProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isParagraphView, setIsParagraphView] = useState<boolean>(true)
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number }>({
    start: 1,
    end: verses.length > 0 ? verses.length : 1,
  })
  const contentRef = useRef<HTMLDivElement>(null)
  const [isSelecting, setIsSelecting] = useState<boolean>(false)
  const [selectionStart, setSelectionStart] = useState<number | null>(null)
  const rangeChangeRef = useRef(onVerseRangeChange)
  const [startMarkerPosition, setStartMarkerPosition] = useState<{ x: number; y: number } | null>(null)
  const [endMarkerPosition, setEndMarkerPosition] = useState<{ x: number; y: number } | null>(null)
  const verseRefs = useRef<Map<number, HTMLElement>>(new Map())
  const [clickSequence, setClickSequence] = useState<number>(0)
  const [lastMovedMarker, setLastMovedMarker] = useState<"start" | "end">("start")
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const dragStartVerseRef = useRef<number | null>(null)

  // For double-click detection
  const lastClickedVerseRef = useRef<number | null>(null)
  const lastClickTimeRef = useRef<number>(0)

  // Update the ref when onVerseRangeChange changes
  useEffect(() => {
    rangeChangeRef.current = onVerseRangeChange
  }, [onVerseRangeChange])

  // Update selected range when verses change
  useEffect(() => {
    if (verses.length > 0) {
      const newRange = { start: 1, end: verses.length }
      setSelectedRange(newRange)
      // Only call onVerseRangeChange when verses actually change
      rangeChangeRef.current(1, verses.length)

      // Clear verse refs when verses change
      verseRefs.current = new Map()

      // Reset click sequence when verses change
      setClickSequence(0)
      setLastMovedMarker("start")
      lastClickedVerseRef.current = null
    }
  }, [verses])

  // Collect references to verse elements and position markers
  const collectVerseRefs = useCallback(() => {
    if (!contentRef.current) return

    // Clear previous refs
    verseRefs.current = new Map()

    // Find all verse elements
    const verseElements = contentRef.current.querySelectorAll(".verse-text")
    verseElements.forEach((element) => {
      const verseElement = element as HTMLElement
      const verseNumberElement = verseElement.querySelector(".verse-number")
      if (verseNumberElement) {
        const verseNumber = Number.parseInt(verseNumberElement.textContent || "1", 10)
        if (!isNaN(verseNumber)) {
          verseRefs.current.set(verseNumber, verseElement)
        }
      }
    })
  }, [])

  // Find the actual text position within a verse element
  const findTextPosition = useCallback(
    (verseElement: HTMLElement, isStart: boolean): { x: number; y: number } => {
      const contentRect = contentRef.current!.getBoundingClientRect()
      const verseRect = verseElement.getBoundingClientRect()

      // Default position (bottom of the verse)
      const position = {
        x: isStart ? verseRect.left : verseRect.right,
        y: verseRect.bottom,
      }

      // For paragraph view, we need more precise positioning
      if (isParagraphView) {
        const verseNumberElement = verseElement.querySelector(".verse-number")
        const textNode = Array.from(verseElement.childNodes).find(
          (node) =>
            node.nodeType === Node.TEXT_NODE ||
            (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).className !== "verse-number"),
        )

        if (isStart && verseNumberElement) {
          // Position after the verse number for start marker
          const verseNumberRect = verseNumberElement.getBoundingClientRect()
          position.x = verseNumberRect.right - 5
          position.y = verseNumberRect.bottom - 30
        } else if (!isStart && textNode) {
          // For end marker, try to find the actual end of text
          const range = document.createRange()
          range.selectNodeContents(verseElement)
          const rects = range.getClientRects()

          if (rects.length > 0) {
            // Get the last line of text
            const lastRect = rects[rects.length - 1]
            position.x = lastRect.right + 5
            position.y = lastRect.bottom - 15
          }
        }
      }

      // Convert to relative position
      return {
        x: position.x - contentRect.left,
        y: position.y - contentRect.top,
      }
    },
    [isParagraphView],
  )

  // Position markers based on the selected verse range
  const positionMarkers = useCallback(() => {
    if (!contentRef.current || verseRefs.current.size === 0) return

    // Position start marker at the beginning of the first highlighted verse
    const startElement = verseRefs.current.get(selectedRange.start)
    if (startElement) {
      const startPosition = findTextPosition(startElement, true)
      setStartMarkerPosition(startPosition)
    }

    // Position end marker at the end of the last highlighted verse
    const endElement = verseRefs.current.get(selectedRange.end)
    if (endElement) {
      const endPosition = findTextPosition(endElement, false)
      setEndMarkerPosition(endPosition)
    }
  }, [selectedRange, findTextPosition])

  // Update marker positions when selection or paragraph view changes
  useEffect(() => {
    // Wait a bit for rendering to complete
    const timer = setTimeout(() => {
      collectVerseRefs()
      positionMarkers()
    }, 100)

    return () => clearTimeout(timer)
  }, [selectedRange, isParagraphView, collectVerseRefs, positionMarkers])

  // Update marker positions on window resize
  useEffect(() => {
    const handleResize = () => {
      collectVerseRefs()
      positionMarkers()
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [collectVerseRefs, positionMarkers])

  const handleVerseMouseDown = useCallback(
    (verseNumber: number, event: React.MouseEvent) => {
      // Start drag selection
      dragStartVerseRef.current = verseNumber

      // Check for double-click on the same verse
      const now = Date.now()
      const isDoubleClick = lastClickedVerseRef.current === verseNumber && now - lastClickTimeRef.current < 500 // 500ms threshold for double-click

      // Check if clicking on the exact same verse again (not just any verse in the selection)
      const isClickingExactSameVerse = verseNumber === lastClickedVerseRef.current && clickSequence >= 2

      // Update last click tracking
      lastClickedVerseRef.current = verseNumber
      lastClickTimeRef.current = now

      // Handle double-click on same verse OR clicking on the exact same verse again
      if (isDoubleClick || isClickingExactSameVerse) {
        setSelectedRange({ start: verseNumber, end: verseNumber })
        setLastMovedMarker("end")
        setClickSequence(2) // Move to subsequent clicks mode
        return
      }

      // First click: Move only start marker
      if (clickSequence === 0) {
        setSelectedRange((prev) => ({ start: verseNumber, end: prev.end }))
        setClickSequence(1)
        setLastMovedMarker("start")
        return
      }

      // Second click: Move only end marker
      if (clickSequence === 1) {
        // Ensure start is always less than or equal to end
        if (verseNumber < selectedRange.start) {
          setSelectedRange((prev) => ({ start: verseNumber, end: prev.start }))
          setLastMovedMarker("start")
        } else {
          setSelectedRange((prev) => ({ start: prev.start, end: verseNumber }))
          setLastMovedMarker("end")
        }
        setClickSequence(2)
        return
      }

      // Subsequent clicks: Enhanced selection behavior
      if (clickSequence >= 2) {
        // Clicking before start marker: Move only start marker
        if (verseNumber < selectedRange.start) {
          setSelectedRange((prev) => ({ start: verseNumber, end: prev.end }))
          setLastMovedMarker("start")
        }
        // Clicking after end marker: Move only end marker
        else if (verseNumber > selectedRange.end) {
          setSelectedRange((prev) => ({ start: prev.start, end: verseNumber }))
          setLastMovedMarker("end")
        }
        // Clicking between markers: Move the marker that was last moved
        else if (verseNumber >= selectedRange.start && verseNumber <= selectedRange.end) {
          if (lastMovedMarker === "start") {
            setSelectedRange((prev) => ({ start: verseNumber, end: prev.end }))
          } else {
            setSelectedRange((prev) => ({ start: prev.start, end: verseNumber }))
          }
          // Update which marker was last moved (same as above)
          // No need to change lastMovedMarker as we're using the existing value
        }
      }
    },
    [clickSequence, selectedRange, lastMovedMarker],
  )

  const handleVerseMouseMove = useCallback(
    (verseNumber: number) => {
      // Handle drag selection
      if (dragStartVerseRef.current !== null) {
        setIsDragging(true)

        // Update selection based on drag
        if (verseNumber < dragStartVerseRef.current) {
          setSelectedRange({
            start: verseNumber,
            end: dragStartVerseRef.current,
          })
        } else {
          setSelectedRange({
            start: dragStartVerseRef.current,
            end: verseNumber,
          })
        }
      }
      // Only handle mouse enter for the normal selection mode (after first two clicks)
      else if (isSelecting && selectionStart !== null) {
        setSelectedRange((prev) => {
          if (verseNumber < selectionStart) {
            return { start: verseNumber, end: selectionStart }
          } else {
            return { start: selectionStart, end: verseNumber }
          }
        })
      }
    },
    [isSelecting, selectionStart],
  )

  const handleMouseUp = useCallback(() => {
    // Handle end of drag selection
    if (isDragging) {
      setIsDragging(false)
      dragStartVerseRef.current = null
      // Set click sequence to 2 to enable subsequent click behaviors
      setClickSequence(2)
      // Update which marker was last moved
      setLastMovedMarker("end")
    }

    if (isSelecting) {
      setIsSelecting(false)
    }

    // For all interactions, call onVerseRangeChange
    rangeChangeRef.current(selectedRange.start, selectedRange.end)
  }, [isSelecting, isDragging, selectedRange])

  // Add mouse up event listener to document
  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseUp])

  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying)
  }

  const handleShare = () => {
    console.log("Sharing:", formatReference(reference))
  }

  const handleParagraphViewChange = (checked: boolean) => {
    setIsParagraphView(checked)
  }

  const handleSelectAll = () => {
    if (verses.length > 0) {
      const newRange = { start: 1, end: verses.length }
      setSelectedRange(newRange)
      rangeChangeRef.current(1, verses.length)
      // Reset click sequence
      setClickSequence(0)
      setLastMovedMarker("start")
      lastClickedVerseRef.current = null
      dragStartVerseRef.current = null
    }
  }

  // Determine marker size based on verse number length
  const getMarkerSize = (verseNumber: number): number => {
    if (verseNumber >= 100) return 1.75 // For 3 digits
    if (verseNumber >= 10) return 1.5 // For 2 digits
    return 1.25 // For 1 digit
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
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch id="paragraph-mode" checked={isParagraphView} onCheckedChange={handleParagraphViewChange} />
              <Label htmlFor="paragraph-mode">Paragraph View</Label>
            </div>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
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
                    onMouseDown={(e) => handleVerseMouseDown(verse.verse, e)}
                    onMouseMove={() => handleVerseMouseMove(verse.verse)}
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
                  onMouseDown={(e) => handleVerseMouseDown(verse.verse, e)}
                  onMouseMove={() => handleVerseMouseMove(verse.verse)}
                >
                  <span className="verse-number font-bold text-sm align-super mr-1">{verse.verse}</span>
                  {verse.text}
                </p>
              ))}
            </div>
          )}

          {/* Start marker circle */}
          {startMarkerPosition && (
            <div
              className="absolute bg-primary rounded-full border-2 border-background shadow-md verse-marker start-marker flex items-center justify-center text-primary-foreground font-medium"
              style={{
                left: `${startMarkerPosition.x}px`,
                top: `${startMarkerPosition.y}px`,
                width: `${getMarkerSize(selectedRange.start)}rem`,
                height: `${getMarkerSize(selectedRange.start)}rem`,
                fontSize: selectedRange.start >= 100 ? "0.6rem" : selectedRange.start >= 10 ? "0.65rem" : "0.75rem",
                transform: "translate(-50%, 50%)",
              }}
            >
              {selectedRange.start}
            </div>
          )}

          {/* End marker circle */}
          {endMarkerPosition && (
            <div
              className="absolute bg-primary rounded-full border-2 border-background shadow-md verse-marker end-marker flex items-center justify-center text-primary-foreground font-medium"
              style={{
                left: `${endMarkerPosition.x}px`,
                top: `${endMarkerPosition.y}px`,
                width: `${getMarkerSize(selectedRange.end)}rem`,
                height: `${getMarkerSize(selectedRange.end)}rem`,
                fontSize: selectedRange.end >= 100 ? "0.6rem" : selectedRange.end >= 10 ? "0.65rem" : "0.75rem",
                transform: "translate(-50%, 50%)",
              }}
            >
              {selectedRange.end}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
