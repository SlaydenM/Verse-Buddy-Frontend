"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CollectionList } from "@/components/ui/collection-list"
import { StudyList } from "../ui/study-list"
import { CreateNewStudy } from "@/components/ui/create-study-modal"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-client"
import { bibleBooks } from "@/lib/bible-data"
import type { BibleReference } from "@/types/bible"
import { BookOpen, Clock, Heart, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface Study {
  id: string
  reference: BibleReference
  dateAdded: string
  isFavorite: boolean
}

interface CollectionItem {
  version?: string
  book: string
  chapter?: number
  startVerse?: number
  endVerse?: number
}

export function StudiesDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>({})
  const [favoriteStudies, setFavoriteStudies] = useState<BibleReference[]>([])
  const [recentStudies, setRecentStudies] = useState<BibleReference[]>([])
  const [references, setReferences] = useState<BibleReference[]>([] as BibleReference[])
  const [isLoading, setIsLoading] = useState(true)
  // console.log("Rerender!: ", user, isLoading, references.length)

  // Load recent studies from API (only when user is authenticated)
  useEffect(() => {
    if (!user) return // Skip for guests

    async function fetchData() {
      // Fire all requests in parallel, don't await each individually
      const favPromise = apiClient.getFavoriteReferences()
      const recPromise = apiClient.getRecentReferences()
      const allPromise = apiClient.getAllReferences()

      try {
        // console.log("awaiting...")
        const [favResult, recResult, allResult] = await Promise.allSettled([favPromise, recPromise, allPromise])

        if (favResult.status === "fulfilled") {
          setFavoriteStudies(favResult.value?.favorites || [])
        } else {
          setFavoriteStudies([])
          console.error("Error loading favorite studies:", favResult.reason)
        }

        if (recResult.status === "fulfilled") {
          setRecentStudies(recResult.value?.references?.slice(0, 6) || [])
        } else {
          setRecentStudies([])
          console.error("Error loading recent studies:", recResult.reason)
        }

        if (allResult.status === "fulfilled") {
          setReferences(allResult.value?.references || [])

          // Initialize favorite map
          if (Object.keys(favoriteMap).length === 0) {
            setFavoriteMap(
              allResult.value?.references.reduce(
                (acc: any, ref: BibleReference) => ({ ...acc, [ref.id]: ref.isFavorite }),
                {},
              ),
            )
          }
        } else {
          setReferences([])
          console.error("Error loading all references:", allResult.reason)
        }
      } catch (error) {
        // This should only catch truly unexpected errors
        console.error("Unexpected error loading references:", error)
      } finally {
        setIsLoading(false)
        // console.log("gotten")
      }
    }
    if (user) {
      fetchData()
    }
  }, [user])

  // Handlers
  const handleStudyClick = () => {
    router.push("/study")
  }

  const updateFavorite = async (ids: string[], isFavorite: boolean) => {
    if (isFavorite) {
      setFavoriteMap(ids.reduce((acc: any, id: string) => ({ ...acc, [id]: false }), favoriteMap))
      setFavoriteStudies((prev) => prev.filter((ref) => !ids.includes(ref.id)))
      await apiClient.unfavoriteAll(ids)
    } else {
      setFavoriteMap(ids.reduce((acc: any, id: string) => ({ ...acc, [id]: true }), favoriteMap))
      setFavoriteStudies((prev) => [...new Set(prev.concat(references.filter((ref) => ids.includes(ref.id))))])
      await apiClient.favoriteAll(ids)
    }
  }

  // Convert recent studies to the Study format for consistency
  /*const recentStudiesFormatted: Study[] = recentStudies.slice(0, 10).map((ref, index) => ({
    id: `recent-${index}`,
    reference: ref,
    dateAdded: new Date().toISOString().split("T")[0], // Mock date
    isFavorite: false,
  }))*/

  // CHANGE: IMPORT FROM MODULE
  const openStudy = (reference: BibleReference) => {
    const params = new URLSearchParams({
      referenceId: reference.id || "",
    })
    router.push(`/study/?${params.toString()}`)
  }
  const onDelete = async (refs: BibleReference[]) => {
    console.log("Delete collection:", refs)

    try {
      // Delete all references in this collection via API
      for (const ref of refs) {
        if (ref.id) {
          await apiClient.deleteReference(ref.id)
          references.splice(references.indexOf(ref), 1)
        }
      }

      // Refresh the page to update the UI
      router.refresh()
    } catch (error) {
      console.error("Error deleting collection:", error)
    }
  }

  // Calculate statistics
  const totalReferences = references.length || 0
  const uniqueBooks = [...new Set(references.map((ref) => ref.book))].length
  const totalVerses = references.reduce((sum, ref) => sum + (ref.endVerse - ref.startVerse + 1), 0)

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading...</span>
      </div>
    )
  }

  // Show guest welcome message if not authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center space-y-6">
        <h1 className="text-3xl font-bold">Welcome to Verse Buddy</h1>
        <p className="text-muted-foreground">Sign in to start saving studies and track your memorization progress.</p>
      </div>
    )
  }

  // Show authenticated user dashboard
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Studies</h1>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleStudyClick}
            className="bg-gray-200 dark:bg-white text-gray-900 hover:bg-gray-300 dark:hover:bg-gray-100"
          >
            Quiz!
          </Button>
          <Badge variant="secondary" className="text-sm">
            {totalReferences} studies • {uniqueBooks} books • {totalVerses} verses
          </Badge>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading studies...</span>
        </div>
      )}

      {!isLoading && references.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Studies Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start your Bible memorization journey by creating your first study.
            </p>
            <CreateNewStudy variant="card" />
          </CardContent>
        </Card>
      )}

      {references.length > 0 && (
        <>
          <div className="flex gap-5 w-full">
            {/* Favorites Section */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Favorites
                  <Badge variant="outline">{favoriteStudies.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favoriteStudies.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No favorite studies yet. Add some studies to your favorites to see them here.
                  </p>
                ) : (
                  <CollectionList
                    references={favoriteStudies}
                    favoriteMap={favoriteMap}
                    updateFavorite={updateFavorite}
                    isFavoriteList
                  />
                )}
              </CardContent>
            </Card>

            {/* Recents Section */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Recents
                  <Badge variant="outline">{recentStudies.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StudyList references={recentStudies} favoriteMap={favoriteMap} updateFavorite={updateFavorite} />
              </CardContent>
            </Card>
          </div>

          {/* All Books Section - Using Collection Component */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-500" />
                All
                <Badge variant="outline">{bibleBooks.length} books</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CollectionList references={references} favoriteMap={favoriteMap} updateFavorite={updateFavorite} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
