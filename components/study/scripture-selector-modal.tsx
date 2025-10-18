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

interface PassageDataDTO { 
  text: string[]; 
  headings: { [verseNum: number]: string };
  startVerse: number;
}

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
  const [startVerse, setStartVerse] = useState<number>(initReference.startVerse || 1)
  const [endVerse, setEndVerse] = useState<number>(initReference.endVerse || 1)
  const [chapterCount, setChapterCount] = useState<number>(0)
  const [verseCount, setVerseCount] = useState<number>(0)
  const [passageData, setPassageData] = useState<PassageDataDTO>({
    text: [],
    headings: {},
    startVerse: 0,
  })
  
  console.log("INIT:", initReference, initReference.book || "Genesis")
  
  
  // Render variables
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingPassage, setIsLoadingPassage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [chapterSelectIsExpanded, setChapterSelectIsExpanded] = useState<boolean>(true)

  // ----------------------------
  // Track mount vs updates
  // ----------------------------
  // const didMountRef = useRef(false)
  const prevBookRef = useRef(book)
  const prevChapterRef = useRef(chapter)
  
  // const updateChapter = 
  
  // const updateBook = 
  
  useEffect(() => {
    setVersion(initReference.version || "NKJV")
    setBook(initReference.book || "Genesis")
    setChapter(initReference.chapter || 1)
    setStartVerse(initReference.startVerse || 1)
    setEndVerse(initReference.endVerse || 1)
  }, [initReference])
  
  // ----------------------------
  // React to book changes AFTER init
  // ----------------------------
  useEffect(() => {
    // console.log("B:", book, chapter)
    if (book !== prevBookRef.current) {
      setChapterCount(getChapterCount(book))
      setChapter(1)
      setChapterSelectIsExpanded(true)
    }
    prevBookRef.current = book
  }, [book])
  
  // ----------------------------
  // React to chapter changes AFTER init
  // ----------------------------
  useEffect(() => {
    // console.log("C:", book, chapter)
    if (chapter !== prevChapterRef.current) {
      const verseCount = getVerseCount(book, chapter)
      setVerseCount(verseCount)
      setStartVerse(1)
      setEndVerse(verseCount || 1)
    }
    prevChapterRef.current = chapter
  }, [chapter])
  
  useEffect(() => {
    setStartVerse(passageData.startVerse);
    if (passageData.text.length > 0) {
      setEndVerse(passageData.startVerse + passageData.text.length - 1);
    }
  }, [passageData])
  
  // ----------------------------
  // Enable update detection *after* first render
  // ----------------------------
  // useEffect(() => {
  //   console.log("M:", book, chapter)
  //   // didMountRef.current = true
  //   initChapterAndVerse()
  // }, [])
  
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
