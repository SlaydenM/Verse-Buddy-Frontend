"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScriptureSelector } from "@/components/study/scripture-selector"
import { MemorizeView } from "@/components/memorize-view"
import { QuizView } from "@/components/quiz-view"
import { RecentStudies } from "@/components/recent-studies"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { BibleReference, BibleVerse, QuizSettings } from "@/types/bible"
import { fetchVerses } from "@/lib/bible-api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export function ScriptureApp() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<string>("memorize")
  const [selectedReference, setSelectedReference] = useState<BibleReference | null>(null)
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [recentStudies, setRecentStudies] = useState<BibleReference[]>([])
  const [quizSettings, setQuizSettings] = useLocalStorage<QuizSettings>("quiz-settings", {
    difficulty: "medium",
    blankPercentage: 15,
  })
  const [verseRange, setVerseRange] = useState<{ start: number, end: number }>({ start: 1, end: 1 })

  // Keep track of the previous reference to detect changes
  const previousReferenceRef = useRef<BibleReference | null>(null)
  // Use refs to avoid dependency issues
  const recentStudiesRef = useRef(recentStudies)
  const verseRangeRef = useRef(verseRange)
  // Track if we've handled URL params to avoid infinite loops
  const hasHandledUrlParamsRef = useRef(false)

  // Update refs when state changes
  useEffect(() => {
    recentStudiesRef.current = recentStudies
  }, [recentStudies])

  useEffect(() => {
    verseRangeRef.current = verseRange
  }, [verseRange])

  // Load recent studies from API on component mount
  useEffect(() => {
    const loadRecentStudies = async () => {
      try {
        const result = await apiClient.getRecentReferences()
        setRecentStudies(result.references)
      } catch (error) {
        console.error("Error loading recent studies:", error)
      }
    }

    loadRecentStudies()
  }, [])

  // Separate function for loading verses without dependencies
  const loadVersesInternal = useCallback(async (reference: BibleReference) => {
    // Set loading state
    setIsLoading(true)
    setError(null)

    try {
      console.log("Loading verses for:", reference)

      // Before loading new verses, save the previous reference to API
      if (
        previousReferenceRef.current &&
        (previousReferenceRef.current.book !== reference.book ||
          previousReferenceRef.current.chapter !== reference.chapter ||
          previousReferenceRef.current.version !== reference.version)
      ) {
        try {
          const updatedPreviousRef = {
            ...previousReferenceRef.current,
            startVerse: verseRangeRef.current.start,
            endVerse: verseRangeRef.current.end,
          }
          await apiClient.createReference(updatedPreviousRef)

          // Reload recent studies
          const result = await apiClient.getRecentReferences()
          setRecentStudies(result.references)
        } catch (error) {
          console.error("Error saving previous reference:", error)
        }
      }

      const fetchedVerses = await fetchVerses(reference)
      console.log("Fetched verses:", fetchedVerses.length, fetchedVerses)

      // Set verses state
      setVerses(fetchedVerses)

      // Save the new reference to API
      try {
        await apiClient.createReference(reference)

        // Reload recent studies to get the updated list
        const result = await apiClient.getRecentReferences()
        setRecentStudies(result.references)
      } catch (error) {
        console.error("Error saving reference:", error)
      }

      // Set initial verse range to full chapter or to the reference's range if specified
      setVerseRange({
        start: reference.startVerse || 1,
        end: reference.endVerse || fetchedVerses.length,
      })

      // Update the previous reference
      previousReferenceRef.current = reference

      // Check if this book/chapter/version combination already exists in recent studies
      const currentRecentStudies = recentStudiesRef.current
      const existingIndex = currentRecentStudies.findIndex(
        (study) =>
          study.version === reference.version && study.book === reference.book && study.chapter === reference.chapter,
      )

      // If it exists, move it to the top (but don't update it yet)
      if (existingIndex !== -1) {
        const existingReference = currentRecentStudies[existingIndex]
        const updatedStudies = [
          existingReference,
          ...currentRecentStudies.slice(0, existingIndex),
          ...currentRecentStudies.slice(existingIndex + 1),
        ].slice(0, 10)
        setRecentStudies(updatedStudies)
      }
      // If it's a completely new reference, add it to recent studies
      else if (existingIndex === -1) {
        setRecentStudies([reference, ...currentRecentStudies.slice(0, 9)])
      }
    } catch (err) {
      console.error("Error loading verses:", err)
      setError("Failed to load verses. Please try again.")
      setVerses([]) // Clear verses on error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle URL parameters on initial load - separate from loadVerses to avoid loops
  useEffect(() => {
    // Only handle URL params once
    if (hasHandledUrlParamsRef.current) return

    const book = searchParams.get("book")
    const chapter = searchParams.get("chapter")
    const version = searchParams.get("version")
    const startVerse = searchParams.get("startVerse")
    const endVerse = searchParams.get("endVerse")

    if (book && chapter) {
      hasHandledUrlParamsRef.current = true

      const reference: BibleReference = {
        version: version || "KJV",
        book,
        chapter: Number.parseInt(chapter, 10),
        startVerse: startVerse ? Number.parseInt(startVerse, 10) : 1,
        endVerse: endVerse ? Number.parseInt(endVerse, 10) : 30, // Default end verse
        finalVerse: 30, // This will be updated when verses are loaded
      }

      setSelectedReference(reference)
      loadVersesInternal(reference)
    }
  }, [searchParams, loadVersesInternal])

  // Public loadVerses function for use by other components
  const loadVerses = useCallback(
    (reference: BibleReference) => {
      loadVersesInternal(reference)
    },
    [loadVersesInternal],
  )

  // Handle reference selection
  const handleReferenceSelect = useCallback(
    (reference: BibleReference) => {
      console.log("Reference selected:", reference)
      setSelectedReference(reference)
      loadVerses(reference)
    },
    [loadVerses],
  )

  const handleRecentStudySelect = (reference: BibleReference) => {
    setSelectedReference(reference)
    loadVerses(reference)
  }

  const handleQuizSettingsChange = (settings: QuizSettings) => {
    setQuizSettings(settings)
  }

  const handleVerseRangeChange = (start: number, end: number) => {
    console.log("Verse range changed:", start, end)
    setVerseRange({ start, end })

    // Update the selected reference with the new verse range
    if (selectedReference) {
      const updatedReference = {
        ...selectedReference,
        startVerse: start,
        endVerse: end,
      }
      setSelectedReference(updatedReference)
    }
  }

  // Filter verses for quiz based on highlighted range
  const quizVerses =
    verseRange && verses.length > 0
      ? verses.filter((verse) => verse.verse >= verseRange.start && verse.verse <= verseRange.end)
      : verses

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <ScriptureSelector
            onReferenceSelect={handleReferenceSelect}
            selectedReference={selectedReference}
            isLoading={isLoading}
          />
        </div>
        <div>
          <RecentStudies studies={recentStudies} onStudySelect={handleRecentStudySelect} />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-8 bg-background border rounded-md">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading scripture...</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && selectedReference && verses.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="memorize">Memorize</TabsTrigger>
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
          </TabsList>
          <TabsContent value="memorize" className="space-y-4">
            <MemorizeView reference={selectedReference} verses={verses} onVerseRangeChange={handleVerseRangeChange} />
          </TabsContent>
          <TabsContent value="quiz" className="space-y-4">
            <QuizView
              reference={selectedReference}
              verses={quizVerses}
              settings={quizSettings}
              onSettingsChange={handleQuizSettingsChange}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
