"use client"
import { CreateNewStudy } from "@/components/ui/create-study-modal"
import { EditStudyModal } from "@/components/ui/edit-study-modal"
import { apiClient } from "@/lib/api-client"
import { getVerseCount } from "@/lib/bible-data"
import type { BibleReference } from "@/types/bible"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Study } from "./study-item"

interface StudyListProps {
  references: BibleReference[]
  favoriteMap: Record<string, boolean>
  updateFavorite: (ids: string[], isFavorite: boolean) => void
}

export function StudyList({ 
  references, 
  favoriteMap,
  updateFavorite, 
}: StudyListProps) {
  const router = useRouter()
  
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingReference, setEditingReference] = useState<BibleReference>(references[0])
  
  const openStudy = (reference: BibleReference) => {
    const params = new URLSearchParams({
      referenceId: reference.id || ""
    })
    router.push(`/study/?${params.toString()}`)
  }
  
  const commaList = (a: Array<any>) => {
    if (a.length === 0) return ""
    if (a.length === 1) return a[0]
    
    const last = a.pop()
    // console.log(a, last)
    return a.join(", ") + (a.length > 1 ? ", and " : " and ") + last
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
  
  const formatItem = ( ref: BibleReference, key: number ): any => {
    const fullVerse = ref.startVerse === 1 && ref.endVerse >= getVerseCount(ref.book, ref.chapter)
    const title = (fullVerse) ? `${ref.book} ${ref.chapter}` : `${ref.book} ${ref.chapter}:${ref.startVerse}-${ref.endVerse}`
    const subtitle = (fullVerse) ? `Visit study (All ${ref.endVerse} verses)` : `Visit study (${ref.endVerse - ref.startVerse + 1} verses)`
    
    return (
      <Study // All verses in chapter
        key={key}
        title={title}
        subtitle={subtitle}
        id={ref.id}
        favoriteMap={favoriteMap}
        updateFavorite={updateFavorite}
        onClick={() => openStudy(ref)}
        onEdit={() => {
          console.log("Edit reference for:", ref)
          setEditingReference(ref)
          setEditDialogOpen(true)
        }}
        onDelete={() => onDelete([ref])}
      />
    )
  }
  
  if (references.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No Recent Studies.</p>
        <CreateNewStudy />
      </div>
    )
  }
  
  return (
    <div className="grid gap-3">
      {references.map((ref, index) => formatItem(ref, index))}
      <EditStudyModal
        isOpen={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        reference={editingReference}
        /*onReferenceUpdated={() => {
          // Refresh the page to get updated data
          router.refresh()
        }}*/
      />
    </div>
  )
}
