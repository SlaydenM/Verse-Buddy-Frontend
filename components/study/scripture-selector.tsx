"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { bibleBooks } from "@/lib/bible-data"
import { fetchVerses } from "@/lib/bible-api"
import type { BibleReference, BibleVerse } from "@/types/bible"

interface ScriptureSelectorProps {
  onSelectionChange?: (reference: BibleReference, verses: BibleVerse[]) => void
  initialReference?: Partial<BibleReference>
}

export function ScriptureSelector({ onSelectionChange, initialReference }: ScriptureSelectorProps) {
  const [version, setVersion] = useState(initialReference?.version || "KJV")
  const [book, setBook] = useState(initialReference?.book || "")
  const [chapter, setChapter] = useState(initialReference?.chapter?.toString() || "")
  const [startVerse, setStartVerse] = useState(initialReference?.startVerse?.toString() || "")
  const [endVerse, setEndVerse] = useState(initialReference?.endVerse?.toString() || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const versions = [
    { value: "KJV", label: "King James Version" },
    { value: "NIV", label: "New International Version" },
    { value: "ESV", label: "English Standard Version" },
    { value: "NASB", label: "New American Standard Bible" },
    { value: "NLT", label: "New Living Translation" },
  ]
  
  const handleFetchVerses = async () => {
    if (!book || !chapter) {
      setError("Please select a book and chapter")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const reference: BibleReference = {
        id: "0", // filler
        version,
        book,
        chapter: Number.parseInt(chapter),
        startVerse: Number.parseInt(startVerse) || 1,
        endVerse: Number.parseInt(endVerse) || Number.parseInt(startVerse) || 1,
        finalVerse: 50, // Default max verses per chapter
      }

      const verses = await fetchVerses(reference)
      onSelectionChange?.(reference, verses)
    } catch (error) {
      console.error("Error fetching verses:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch verses")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Scripture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Bible Version</Label>
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Book</Label>
            <Select value={book} onValueChange={setBook}>
              <SelectTrigger>
                <SelectValue placeholder="Select book" />
              </SelectTrigger>
              <SelectContent>
                {bibleBooks.map((bookName) => (
                  <SelectItem key={bookName} value={bookName}>
                    {bookName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="chapter">Chapter</Label>
            <Input
              id="chapter"
              type="number"
              min="1"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startVerse">Start Verse</Label>
            <Input
              id="startVerse"
              type="number"
              min="1"
              value={startVerse}
              onChange={(e) => setStartVerse(e.target.value)}
              placeholder="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endVerse">End Verse</Label>
            <Input
              id="endVerse"
              type="number"
              min="1"
              value={endVerse}
              onChange={(e) => setEndVerse(e.target.value)}
              placeholder="1"
            />
          </div>
        </div>
        
        <Button onClick={handleFetchVerses} disabled={isLoading} className="w-full">
          {isLoading ? "Loading..." : "Fetch Verses"}
        </Button>
      </CardContent>
    </Card>
  )
}
