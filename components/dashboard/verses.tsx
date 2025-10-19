"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CollectionList } from "@/components/ui/collection-list"
import { CreateNewStudy } from "@/components/ui/create-study-modal"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { apiClient } from "@/lib/api-client"
import type { BibleReference } from "@/types/bible"
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

interface Study {
  id: string
  reference: BibleReference
  dateAdded: string
  isFavorite: boolean
}

export function VersesDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // const { user, loading: authLoading } = useAuth()
  const book = searchParams.get("book") || "Genesis"
  const chapter = Number.parseInt(searchParams.get("chapter") || "1", 10)

  // const redirectToStudies = Boolean(searchParams.get("s"))
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>({})
  const [favoriteStudies, setFavoriteStudies] = useLocalStorage<Study[]>("favoriteStudies", [])
  const [references, setReferences] = useState<BibleReference[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load references for this specific book and chapter from API
  useEffect(() => {
    // if (!user) return // Skip for guests

    const loadChapterReferences = async () => {
      try {
        setIsLoading(true)
        const result = await apiClient.getReferencesByChapter(book, chapter)
        setReferences(result.references)

        if (Object.keys(favoriteMap).length === 0) {
          setFavoriteMap(
            result.references.reduce((acc: any, ref: BibleReference) => ({ ...acc, [ref.id]: ref.isFavorite }), {}),
          )
        }
      } catch (error) {
        console.error("Error loading chapter references:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (book && chapter) {
      loadChapterReferences()
    }
  }, [])

  const handleBackClick = () => {
    router.back()
  }

  const handleStudyClick = () => {
    router.push(`/study?book=${book}&chapter=${chapter}`)
  }

  const handleToggleFavorite = (studyId: string, reference: BibleReference) => {
    const existingFavorite = favoriteStudies.find((fav) => fav.id === studyId)

    if (existingFavorite) {
      // Remove from favorites
      setFavoriteStudies(favoriteStudies.filter((study) => study.id !== studyId))
    } else {
      // Add to favorites
      const newFavorite: Study = {
        id: `fav-${Date.now()}`,
        reference,
        dateAdded: new Date().toISOString().split("T")[0],
        isFavorite: true,
      }
      setFavoriteStudies([newFavorite, ...favoriteStudies])
    }
  }

  const updateFavorite = async (ids: string[], isFavorite: boolean) => {
    if (isFavorite) {
      setFavoriteMap(ids.reduce((acc: any, id: string) => ({ ...acc, [id]: false }), favoriteMap))
      await apiClient.unfavoriteAll(ids)
    } else {
      setFavoriteMap(ids.reduce((acc: any, id: string) => ({ ...acc, [id]: true }), favoriteMap))
      await apiClient.favoriteAll(ids)
    }
  }

  // Calculate verse statistics
  const verseRangesCount = references.length
  const totalVerses = references.reduce((sum, ref) => sum + (ref.endVerse - ref.startVerse + 1), 0)
  const verseRanges = references.map((ref) => `${ref.startVerse}-${ref.endVerse}`).join(", ")

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {book} {chapter}
            </h1>
            <p className="text-muted-foreground">
              Studies for this chapter{references.length > 0 ? ` (verses: ${verseRanges})` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleStudyClick}
            className="bg-gray-200 dark:bg-white text-gray-900 hover:bg-gray-300 dark:hover:bg-gray-100"
          >
            Quiz!
          </Button>
          <Badge variant="secondary" className="text-sm">
            {references.length} studies • {totalVerses} verses
          </Badge>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading verses...</span>
        </div>
      )}

      {!isLoading && references.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              No Studies in {book} {chapter}
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first study for {book} chapter {chapter}.
            </p>
            <CreateNewStudy />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Studies
              <Badge variant="outline">{verseRangesCount}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CollectionList
              references={references}
              favoriteMap={favoriteMap}
              updateFavorite={updateFavorite}
              book={book}
              chapter={chapter}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
