"use client"
import { Collection } from "@/components/ui/collection"
import { CreateNewStudy } from "@/components/ui/create-study-modal"
import { EditStudyModal } from "@/components/ui/edit-study-modal"
import { apiClient } from "@/lib/api-client"
import { BookType, getChapterCount, getVerseCount } from "@/lib/bible-data"
import type { BibleReference } from "@/types/bible"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface CollectionListProps {
  references: BibleReference[]
  addToFavorites: (ref: BibleReference) => void
  removeFromFavorites: (ref: BibleReference) => void
  isFavoriteList?: boolean | false
  prevLink?: string | null
  book?: string | null
  chapter?: number | null
}

export function CollectionList({ references, addToFavorites, removeFromFavorites, isFavoriteList, prevLink = "pages/studies", book = null, chapter = null }: CollectionListProps) {
  const router = useRouter()
  
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingReference, setEditingReference] = useState<BibleReference>(references[0])
  
  const openCollectionChapters = (book: string) => {
    router.push(`/pages/studies/chapters?book=${encodeURIComponent(book)}`)
  }
  
  const openCollectionVerses = (book: string, chapter: number) => {
    router.push(`/pages/studies/verses?book=${encodeURIComponent(book)}&chapter=${chapter}`)
  }
  
  const openStudy = (reference: BibleReference) => {
    const params = new URLSearchParams({
      referenceId: reference.id || ""
    })
    router.push(`/study/?${params.toString()}`)
  }
  
  const groupBooks = (refs: BibleReference[]) => {
    const bookGroups = refs.reduce(
      (groups, ref) => {
        if (!groups[ref.book]) {
          groups[ref.book] = [] // Add field
        }
        groups[ref.book].push(ref) // Add reference to book
        //groups.push(ref)
        return groups
      },
      {} as Record<string, BibleReference[]>,
    )
    return Object.values(bookGroups)
  }
  
  const groupChapters = (refs: BibleReference[]) => {
    // Count chapters and group
    const chapterGroups = refs.reduce(
      (groups, ref) => {
        if (!groups[ref.chapter]) {
          groups[ref.chapter] = [] // Add field
        }
        groups[ref.chapter].push(ref) // Add reference to book
        return groups
      },
      {} as Record<string, BibleReference[]>,
    )
    return Object.values(chapterGroups)
  }
  
  const commaList = (a: Array<any>) => {
    if (a.length === 0) return ""
    if (a.length === 1) return a[0]
    
    const last = a.pop()
    console.log(a, last)
    return a.join(", ") + (a.length > 1 ? ", and " : " and ") + last
  }
  
  const commaRangeList = (a: number[]): string => {
    if (a.length === 0) return ""
    
    // Sort and remove duplicates
    a = [...new Set(a)].sort((x, y) => x - y)
    
    const ranges: string[] = []
    let start = a[0]
    let end = a[0]
    
    for (let i = 1; i < a.length; i++) {
      if (a[i] === end + 1) {
        end = a[i]
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`)
        start = end = a[i]
      }
    }
    
    // Push the final range
    ranges.push(start === end ? `${start}` : `${start}-${end}`)
    
    return commaList(ranges) //.join(", ");
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
  
  const formatCollection = ( refs: BibleReference[] ): {
    title: string
    subtitle: string
    onClick: () => void
    onToggleFavorite?: () => void
    onEditReference?: () => void
    onDelete?: () => void
  } => {
    if (refs.length === 0) {
      return {
        title: "No studies found",
        subtitle: "Create a new study to get started",
        onClick: () => {},
      }
    }
    
    const chapterGroups = groupChapters(refs)
    const book = refs[0].book
    
    if (chapter || chapterGroups.length === 1) {
      // One chapter
      const chapterNum = refs[0].chapter
      if (refs.length === 1) {
        // One verse range
        const ref = refs[0]
        return ref.startVerse === 1 && ref.endVerse >= getVerseCount(ref.book, ref.chapter)
          ? {
              // All verses in chapter
              title: `${ref.book} ${ref.chapter}`,
              subtitle: `Visit study (All ${ref.endVerse} verses)`,
              onClick: () => openStudy(ref),
              onToggleFavorite: () => {
                console.log("Toggle favorite for:", refs)
                // TODO: Implement favorite toggle logic
              },
              onEditReference: () => {
                console.log("Edit reference for:", refs)
                setEditingReference(ref)
                setEditDialogOpen(true)
              },
              onDelete: () => onDelete(refs),
            }
          : {
              // Any verse range
              title: `${ref.book} ${ref.chapter}:${ref.startVerse}-${ref.endVerse}`,
              subtitle: `Visit study (${ref.endVerse - ref.startVerse + 1} verses)`,
              onClick: () => openStudy(ref),
              onToggleFavorite: () => {
                console.log("Toggle favorite for:", refs)
                // TODO: Implement favorite toggle logic
              },
              onEditReference: () => {
                console.log("Edit reference for:", refs)
                setEditingReference(ref)
                setEditDialogOpen(true)
              },
              onDelete: () => onDelete(refs),
            }
      } else {
        // Multiple verse ranges in same chapter
        //const totalVerses = refs.reduce((sum, ref) => sum + (ref.endVerse - ref.startVerse + 1), 0)
        const verseRanges = refs.map((ref) => `${ref.startVerse}-${ref.endVerse}`)
        return {
          title: `${book} ${chapterNum}`,
          subtitle: `${refs.length} studies (Verses ${commaList(verseRanges)})`,
          onClick: () => openCollectionVerses(book, chapterNum),
          onToggleFavorite: () => {
            console.log("Toggle favorite for:", refs)
            // TODO: Implement favorite toggle logic
          },
          onEditReference: () => {
            // console.log("Edit reference for:", refs)
            // setEditingReference(ref)
            // setEditDialogOpen(true)
          },
          onDelete: () => onDelete(refs),
        }
      }
    } else {
      // Multiple chapters
      const chapters = [...new Set(refs.map((ref) => ref.chapter))].sort()
      const chaptersRangeList = commaRangeList(chapters)
      
      return chapters.length === getChapterCount(book) // || chapters.length > 3
        ? {
            // All chapters in book
            title: book,
            subtitle: `All ${chapters.length} chapters (${refs.length} studies)`,
            onClick: () => openCollectionChapters(book),
            onToggleFavorite: () => {
              console.log("Toggle favorite for:", refs)
              // TODO: Implement favorite toggle logic
            },
            onEditReference: () => {
              // console.log("Edit reference for:", refs)
              // setEditingReference(ref)
              // setEditDialogOpen(true)
            },
            onDelete: () => onDelete(refs),
          }
        : chaptersRangeList.includes(",")
          ? {
              // One full range
              title: `${book} ${chaptersRangeList}`,
              subtitle: `${refs.length} studies)`,
              onClick: () => openCollectionChapters(book),
              onToggleFavorite: () => {
                console.log("Toggle favorite for:", refs)
                // TODO: Implement favorite toggle logic
              },
              onEditReference: () => {
                // console.log("Edit reference for:", refs)
                // setEditingReferences(refs)
                // setEditDialogOpen(true)
              },
              onDelete: () => onDelete(refs),
            }
          : {
              // Multiple chapter ranges
              title: book,
              subtitle: `Chapters ${chaptersRangeList}`,
              onClick: () => openCollectionChapters(book),
              onToggleFavorite: () => {
                console.log("Toggle favorite for:", refs)
                // TODO: Implement favorite toggle logic
              },
              onEditReference: () => {
                // console.log("Edit reference for:", refs)
                // setEditingReference(ref)
                // setEditDialogOpen(true)
              },
              onDelete: () => onDelete(refs),
            }
    }
  }
  
  const collectionListComponent = (groups: BibleReference[][]) => {
    if (groups.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No studies found for this selection.</p>
          <CreateNewStudy />
        </div>
      )
    }
    
    // const nextChapter = (book && !chapter) ? groups : 1
    
    // Find the next missing chapter in the sequence for the current book
    let nextChapter = 1;
    if (book && !chapter) {
      // Flatten all references in groups to get all chapters
      const chapters = groups.flat().map(ref => ref.chapter).sort((a, b) => a - b);
      for (let i = 0; i < chapters.length; i++) {
      if (chapters[i] !== nextChapter) {
        break;
      }
      nextChapter++;
      }
    }

    const initReference = {
      book: book as BookType,
      chapter: nextChapter
    }
    
    return (
      <div className="grid gap-3">
        {groups.map((group, index) => {
          const refsArray = Array.isArray(group) ? group : [group]
          const collection = formatCollection(refsArray)
          return (
            <Collection
              key={index}
              title={collection.title}
              subtitle={collection.subtitle}
              references={group}
              isFavorite={false} // TODO: Implement favorite status logic
              addToFavorites={addToFavorites}
              removeFromFavorites={removeFromFavorites}
              onCollectionClick={collection.onClick}
              onEditReference={collection.onEditReference}
              onDelete={collection.onDelete}
            />
          )
        })}
        
        {!isFavoriteList && <CreateNewStudy initReference={initReference} />}
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
  
  
  // Show verse-ranges
  if (chapter) {
    return collectionListComponent(references.map(ref => [ref]))
  }
  
  // Show chapters
  if (book) {
    const chapterGroups = groupChapters(references)
    return collectionListComponent(chapterGroups)
  }
  
  // Show books
  const bookGroups = groupBooks(references)
  return collectionListComponent(bookGroups)
}
