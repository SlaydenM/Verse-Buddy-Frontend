"use client"

import { StudyItem } from "@/components/study/study-item"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CollectionList } from "@/components/ui/collection-list"
import { CreateNewStudy } from "@/components/ui/create-study-modal"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-client"
import { bibleBooks } from "@/lib/bible-data"
import type { BibleReference } from "@/types/bible"
import { BookOpen, Clock, Heart, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

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
  // ===== ALL HOOKS MUST BE CALLED FIRST (before any early returns) =====
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [favoriteStudies, setFavoriteStudies] = useState<BibleReference[]>([])
  const [recentStudies, setRecentStudies] = useState<BibleReference[]>([])
  const [references, setReferences] = useState<BibleReference[]>([])
  const [isLoadingReferences, setIsLoadingReferences] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  // Load recent studies from API (only when user is authenticated)
  useEffect(() => {
    if (!user) return // Skip for guests
    
    // Favorite studies
    const loadFavoriteStudies = async () => {
      try {
        const result = await apiClient.getFavoriteReferences()
        // Make sure we're setting an array, not the full response object
        setFavoriteStudies(result.favorites || [])
      } catch (error) {
        console.error("Error loading favorite studies:", error)
        setFavoriteStudies([]) // Set empty array on error
      }
    }
    loadFavoriteStudies()
    
    // Recent studies
    const loadRecentStudies = async () => {
      try {
        const result = await apiClient.getRecentReferences()
        // Make sure we're setting an array, not the full response object
        setRecentStudies(result.references.slice(0, 6) || [])
      } catch (error) {
        console.error("Error loading recent studies:", error)
        setRecentStudies([]) // Set empty array on error
      }
    }
    loadRecentStudies()
    
    // All studies
    const loadAllReferences = async () => {
      try {
        setIsLoadingReferences(true)
        const result = await apiClient.getAllReferences()
        setReferences(result.references)
      } catch (error) {
        console.error("Error loading all references:", error)
      } finally {
        setIsLoadingReferences(false)
      }
    }
    loadAllReferences()
  }, [user])
  
  // ===== ALL HOOKS ABOVE THIS LINE =====
  
  const handleStudyClick = (reference: BibleReference) => {
    router.push(`/study?referenceId=${reference.id}`)
  }
  
  const addToFavorites = (reference: BibleReference) => {
    reference.isFavorite = true
    setFavoriteStudies((prev) => [reference, ...prev])
  }
  
  const removeFromFavorites = (reference: BibleReference) => {
    reference.isFavorite = false
    setFavoriteStudies((prev) => prev.filter((r) => r !== reference))
  }
  
  const onToggleFavorite = (reference: BibleReference) => {
    (reference.isFavorite) ? removeFromFavorites(reference) : addToFavorites(reference)
  }
  
  const handleRecentsFavoriteClick = async (ref: BibleReference) => {
    try {
      // Toggle favorite status for this reference
      const response = await apiClient.updateReference(ref.id, { isFavorite: !ref.isFavorite })
      if (response.success) {
        onToggleFavorite(ref)
      }
      
      // Optional: Show success feedback
      console.log("Favorite status updated successfully")
      return response
    } catch (error) {
      console.error("Failed to update favorite status:", error)
      // Optional: Show error feedback to user
    }
  }
  
  // Convert recent studies to the Study format for consistency
  /*const recentStudiesFormatted: Study[] = recentStudies.slice(0, 10).map((ref, index) => ({
    id: `recent-${index}`,
    reference: ref,
    dateAdded: new Date().toISOString().split("T")[0], // Mock date
    isFavorite: false,
  }))*/
  
  // Calculate statistics
  const totalReferences = references.length
  const uniqueBooks = [...new Set(references.map((ref) => ref.book))].length
  const totalVerses = references.reduce((sum, ref) => sum + (ref.endVerse - ref.startVerse + 1), 0)
  
  // ===== NOW WE CAN SAFELY RETURN DIFFERENT CONTENT =====
  
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
        <Badge variant="secondary" className="text-sm">
          {totalReferences} studies • {uniqueBooks} books • {totalVerses} verses
        </Badge>
      </div>
      
      {(isLoading || isLoadingReferences) && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading studies...</span>
        </div>
      )}
      
      {!isLoading && !isLoadingReferences && references.length === 0 && (
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
          {/* Favorites Section */}
          <Card>
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
                  addToFavorites={addToFavorites}
                  removeFromFavorites={removeFromFavorites}
                  isFavoriteList={true} 
                />
              )}
            </CardContent>
          </Card>
          
          {/* Recents Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Recents
                <Badge variant="outline">{recentStudies.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentStudies.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No recent studies. Start studying some verses to see them here.
                </p>
              ) : (
                <div className="grid gap-3">
                  {recentStudies.map((ref, index) => {
                    const id = `recent-${index}`
                    return <StudyItem
                      key={id}
                      id={id}
                      reference={ref}
                      dateAdded={new Date().toISOString().split("T")[0]}
                      isFavorite={ref.isFavorite}
                      onClick={() => handleStudyClick(ref)}
                      onToggleFavorite={() => handleRecentsFavoriteClick(ref)}
                      showFavoriteButton={true}
                    />
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          
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
              <CollectionList 
                references={references} 
                addToFavorites={addToFavorites}
                removeFromFavorites={removeFromFavorites}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
