"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CollectionList } from "@/components/ui/collection-list"
import { CreateNewStudy } from "@/components/ui/create-study-modal"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-client"
import type { BibleReference } from "@/types/bible"
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

interface CollectionItem {
  version?: string
  book: string
  chapter?: number
  startVerse?: number
  endVerse?: number
}

export function ChaptersDashboard() {
  const router = useRouter()
  // const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const book = searchParams.get("book") || "Genesis"
  
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>({});
  const [references, setReferences] = useState<BibleReference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Load references for this specific book from API
  useEffect(() => {
    // if (!user) return // Skip for guests
    
    const loadBookReferences = async () => {
      try {
        setIsLoading(true)
        const result = await apiClient.getReferencesByBook(book)
        setReferences(result.references)
        
        if (Object.keys(favoriteMap).length === 0) {
          setFavoriteMap(result.references.reduce((acc: any, ref: BibleReference) => ({ ...acc, [ref.id]: ref.isFavorite }), {}));
        }
      } catch (error) {
        console.error("Error loading book references:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (book) {
      loadBookReferences()
    }
  }, [])
  
  const updateFavorite = async (ids: string[], isFavorite: boolean) => {   
    if (isFavorite) {
      setFavoriteMap(ids.reduce((acc: any, id: string) => ({ ...acc, [id]: false }), favoriteMap))
      await apiClient.unfavoriteAll(ids);
    } else {
      setFavoriteMap(ids.reduce((acc: any, id: string) => ({ ...acc, [id]: true }), favoriteMap))
      await apiClient.favoriteAll(ids);
    }
  }
  // Get unique chapters from the references
  const uniqueChapters = [...new Set(references.map((ref) => ref.chapter))].sort((a, b) => a - b)
  const chapterCount = uniqueChapters.length
  
  // Calculate chapter statistics
  const totalVerses = references.reduce((sum, ref) => sum + (ref.endVerse - ref.startVerse + 1), 0)
  
  const handleBackClick = () => {
    router.back()
  }
  
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{book}</h1>
            <p className="text-muted-foreground">Select a chapter to view studies</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          {references.length} studies • {uniqueChapters.length} chapters • {totalVerses} verses
        </Badge>
      </div>
      
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading chapters...</span>
        </div>
      )}
      
      {!isLoading && references.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Studies in {book}</h3>
            <p className="text-muted-foreground mb-6">Create your first study for the book of {book}.</p>
            <CreateNewStudy />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Chapters
              <Badge variant="outline">{chapterCount}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <CollectionList 
                references={references} 
                favoriteMap={favoriteMap}
                updateFavorite={updateFavorite}
                book={book} 
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
