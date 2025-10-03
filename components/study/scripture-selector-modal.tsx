"use client"

import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChapterGrid } from "@/components/ui/chapter-grid"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { VerseRangeSlider } from "@/components/ui/verse-range-slider"
import { apiClient } from "@/lib/api-client"
import { bibleBooks, bibleVersions, BookType, getChapterCount, getVerseCount, getYouVersionURL } from "@/lib/bible-data"
import type { BibleReference } from "@/types/bible"
import { BookOpen, CheckCircle, Copy, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import PassageEditor from "../ui/passage-editor"

/*interface ScriptureSelectorModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onReferenceSelect: (reference: BibleReference) => void
  // initReference?.book?: string
  // initReference?.chapter?: number
  initReference?: Partial<BibleReference>
}

export function ScriptureSelectorModal({ isOpen, onOpenChange, onReferenceSelect, initReference = {version: "NKJV", book: "Exodus", chapter: 1}}: ScriptureSelectorModalProps) {
  const [version, setVersion] = useState<string>(initReference.version!)
  const [book, setBook] = useState<BookType>((initReference.book) as BookType)
  const [chapter, setChapter] = useState<number>(initReference.chapter as number)
  const [startVerse, setStartVerse] = useState<number>(initReference?.startVerse || 1)
  const [endVerse, setEndVerse] = useState<number>(initReference?.endVerse || 1)
  const [passageData, setPassageData] = useState<{ text: string[]; headings: { [verseNum: number]: string } }>({
    text: [],
    headings: {},
  })
  const [chapterCount, setChapterCount] = useState<number>(0)
  const [verseCount, setVerseCount] = useState<number>(0)
  const [chapterSelectIsExpanded, setChapterSelectIsExpanded] = useState<boolean>(!initReference || true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingPassage, setIsLoadingPassage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Update chapter count when book changes
  useEffect(() => {
    if (book) {
      const count = getChapterCount(book)
      setChapterCount(count)
      // Reset chapter to 1 when book changes
      if (book !== initReference?.book) setChapter(1)
      setChapterSelectIsExpanded(!chapterSelectIsExpanded)
    } else {
      setChapterCount(0)
    }
  }, [book])
  
  // Update verse count when book and chapter change
  useEffect(() => {
    if (book && chapter) {
      const count = getVerseCount(book, chapter)
      setVerseCount(count)
      // Reset verse selection when chapter changes
      setStartVerse(1)
      setEndVerse(count)
    } else {
      setVerseCount(0)
    }
  }, [book, chapter])

  // Ensure end verse is not less than start verse
  useEffect(() => {
    if (endVerse < startVerse) {
      setEndVerse(startVerse)
    }
  }, [startVerse, endVerse])

  // Clear messages when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSuccess(null)
    }
  }, [isOpen])

  // Set initial book from props
  useEffect(() => {
    if (initReference?.book) {
      setBook(initReference?.book as BookType)
    }
  }, [initReference?.book])
  
  // Set initial chapter from props
  useEffect(() => {
    if (initReference?.chapter) {
      setChapter(initReference?.chapter)
    }
  }, [initReference?.chapter])*/

export interface ScriptureSelectorModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onReferenceSelect: (reference: BibleReference) => void
  initReference?: Partial<BibleReference>
  handleSubmit: (reference: BibleReference) => Promise<{result: BibleReference, success: string}>
}

export function ScriptureSelectorModal({
  isOpen,
  onOpenChange,
  onReferenceSelect,
  initReference = {},
  handleSubmit
}: ScriptureSelectorModalProps) {
  // ----------------------------
  // INITIAL STATE (once only)
  // ----------------------------
  const [version, setVersion] = useState<string>(initReference.version || "NKJV")
  const [book, setBook] = useState<BookType>(initReference.book || "Genesis")
  const [chapter, setChapter] = useState<number>(initReference.chapter || 1)
  const [startVerse, setStartVerse] = useState<number>(initReference.startVerse ?? 1)
  const [endVerse, setEndVerse] = useState<number>(initReference.endVerse ?? 1)
  
  const [passageData, setPassageData] = useState<{ text: string[]; headings: { [verseNum: number]: string } }>({
    text: [],
    headings: {},
  })

  const [chapterCount, setChapterCount] = useState<number>(0)
  const [verseCount, setVerseCount] = useState<number>(0)
  const [chapterSelectIsExpanded, setChapterSelectIsExpanded] = useState<boolean>(true)

  // Render variables
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingPassage, setIsLoadingPassage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // ----------------------------
  // Track mount vs updates
  // ----------------------------
  const didMountRef = useRef(false)
  const prevBookRef = useRef(book)
  const prevChapterRef = useRef(chapter)
  
  const initChapterAndVerse = () => {
    setVerseCount(getVerseCount(book, chapter))
    setChapterCount(getChapterCount(book))
    // console.log("CHANG:", book, chapter)
  }

  // ----------------------------
  // React to book changes AFTER init
  // ----------------------------
  useEffect(() => {
    if (!didMountRef.current) return
    if (book !== prevBookRef.current) {
      setChapter(1)
      setChapterSelectIsExpanded(true)
      setStartVerse(1)
      setEndVerse(verseCount || 1) // safe default
    }
    prevBookRef.current = book
  }, [book, verseCount])

  // ----------------------------
  // React to chapter changes AFTER init
  // ----------------------------
  useEffect(() => {
    if (!didMountRef.current) return
    if (chapter !== prevChapterRef.current) {
      setStartVerse(1)
      setEndVerse(verseCount || 1)
    }
    prevChapterRef.current = chapter
  }, [chapter, verseCount])
  
  useEffect(initChapterAndVerse, [book, chapter])
  
  // ----------------------------
  // Enable update detection *after* first render
  // ----------------------------
  useEffect(() => {
    didMountRef.current = true
    initChapterAndVerse()
  }, [])
  
  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVersion(e.target.value)
    setError(null)
    setSuccess(null)
  }

  const handleBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBook(e.target.value as BookType)
    setError(null)
    setSuccess(null)
  }

  const handleChapterSelect = (selectedChapter: number) => {
    setChapter(selectedChapter)
    setError(null)
    setSuccess(null)
  }

  const handleStartVerseChange = (verse: number) => {
    setStartVerse(verse)
    setError(null)
    setSuccess(null)
  }

  const handleEndVerseChange = (verse: number) => {
    setEndVerse(verse)
    setError(null)
    setSuccess(null)
  }
  
  const handlePasteFromBible = () => {
    let url = getYouVersionURL(book, chapter, version)
    // if (startVerse === endVerse)
    //   url += "." + startVerse
    window.open(url, "_blank")
  }
  
  const handleCreateStudy = async () => {
    if (!canCreateStudy) return
    
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const reference: BibleReference = {
        id: "0", // filler
        version,
        book,
        chapter,
        startVerse,
        endVerse,
        finalVerse: verseCount,
        text: passageData.text,
        headings: passageData.headings
      }
      
      const { result, success } = await handleSubmit(reference);
      
      setSuccess(success)
      
      // Wait a moment to show the success message
      setTimeout(() => {
        // Call the parent handler to navigate to the study
        onReferenceSelect(result)
        
        // Close the dialog
        onOpenChange(false)
        
        // Reset form state
        setSuccess(null)
        setError(null)
      }, 1000)
    } catch (error) {
      console.error("Error creating study:", error)
      setError("Failed to create study. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const canCreateStudy = book && chapter && version && startVerse && endVerse && verseCount > 0

  const selectedReference = `${book} ${chapter}:${startVerse}${startVerse !== endVerse ? `-${endVerse}` : ""} (${version})`

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <BookOpen className="h-5 w-5" />
            Create New Study
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Select a Bible version, book, chapter, and verse range to create your new study
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 mt-4">
          {/* Error and Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Version and Book Selection */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-version" className="text-sm font-medium">
                Bible Version
              </Label>
              <select
                id="dialog-version"
                value={version}
                onChange={handleVersionChange}
                className="w-full h-11 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading || isSaving}
              >
                {bibleVersions.map((v) => (
                  <option key={v.abv} value={v.abv}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-book" className="text-sm font-medium">
                Book
              </Label>
              <select
                id="dialog-book"
                value={book}
                onChange={handleBookChange}
                className="w-full h-11 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading || isSaving}
              >
                {bibleBooks.map((bookName) => (
                  <option key={bookName} value={bookName}>
                    {bookName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chapter Selection */}
          {book && (
            <div>
              <Label className="mb-2 block text-sm font-medium">Chapter</Label>
              <ChapterGrid
                chapterCount={chapterCount}
                selectedChapter={chapter}
                onChapterSelect={handleChapterSelect}
                isExpanded={chapterSelectIsExpanded}
                setIsExpanded={setChapterSelectIsExpanded}
                disabled={isLoading || isSaving || !book}
              />
            </div>
          )}
          
          {/* Verse Range Selection */}
          {book && chapter && verseCount > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Verses</Label>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <VerseRangeSlider
                    min={1}
                    max={verseCount}
                    startValue={startVerse}
                    endValue={endVerse}
                    onStartChange={handleStartVerseChange}
                    onEndChange={handleEndVerseChange}
                    disabled={isLoading || isSaving}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Passage Section */}
          {book && chapter && verseCount > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Passage</Label>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  {/* Reference and Paste Button */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{selectedReference}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      // target="_blank"
                      onClick={handlePasteFromBible}
                      disabled={isLoadingPassage || isSaving}
                      className="flex items-center gap-2 bg-transparent"
                    >
                      {isLoadingPassage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                      {isLoadingPassage ? "Loading..." : "Paste From Bible ↗"}
                    </Button>
                  </div>

                  {/* Editable Text Area */}
                  <PassageEditor
                    className="min-h-[120px]"
                    onPassageDataChange={setPassageData}
                    initReference={initReference}
                  />
                  
                  {/* <Textarea
                    placeholder="Paste or type the passage text here..."
                    value={passageText}
                    onChange={(e) => {
                      setPassageText(e.target.value)
                    }}
                    className="min-h-[120px] resize-none"
                    disabled={isSaving}
                  /> */}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateStudy}
              disabled={!canCreateStudy || isLoading || isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSaving ? "Creating Study..." : "Create Study"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
