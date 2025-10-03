"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import dynamic from "next/dynamic"
import type { BibleReference } from "@/types/bible"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

const ScriptureSelectorModal = dynamic(
  () => import("@/components/study/scripture-selector-modal").then(mod => mod.ScriptureSelectorModal),
  { ssr: false }
)

interface CreateNewStudyProps {
  variant?: "default" | "card"
  className?: string
  onStudyCreated?: () => void // Optional callback for custom refresh logic
  initReference?: Partial<BibleReference>
}

export function CreateNewStudy({ variant = "default", className = "", onStudyCreated, initReference }: CreateNewStudyProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  
  const handleStudyCreated = async () => {
    console.log("Study created, refreshing data...")
    
    try {
      // Force a page refresh to ensure all components get the latest data
      // This is more reliable than trying to coordinate state updates across components
      if (typeof window !== "undefined") {
        // Use router.refresh() for Next.js App Router
        router.refresh()
        
        // Also call the optional callback if provided
        if (onStudyCreated) {
          onStudyCreated()
        }
      }
    } catch (error) {
      console.error("Error refreshing data after study creation:", error)
    }
  }
  
  const handleReferenceSelect = (reference: BibleReference) => {
    console.log("New study reference selected:", reference)
    
    // Call the refresh function
    handleStudyCreated()
    
    // Navigate to main app with this specific reference
    const params = new URLSearchParams({
      referenceId: reference.id,
      // book: reference.book,
      // chapter: reference.chapter.toString(),
      // version: reference.version,
      // startVerse: reference.startVerse.toString(),
      // endVerse: reference.endVerse.toString(),
    })
    
    // router.push(`/?${params.toString()}`)
    router.push(`/study?${params.toString()}`)
  }
  
  const handleClick = () => {
    console.log("Add new study clicked")
    setIsOpen(true)
  }
  
  const createStudy = async (reference: BibleReference): Promise<{result: BibleReference, success: string}> => {
    console.log("Creating study with reference:", reference)
      
    // Save the reference to the database via API
    const result = await apiClient.createReference(reference)
    console.log("Reference saved to database:", result.reference)
    
    // Show success message
    return { result: result.reference, success: "Successfully created reference!"}
  }
  
  if (variant === "card") {
    return (
      <>
        <div
          className={`flex items-center justify-center p-6 sm:p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 hover:bg-muted/25 active:bg-muted/40 cursor-pointer transition-colors touch-manipulation min-h-[120px] ${className}`}
          onClick={handleClick}
        >
          <div className="text-center">
            <Plus className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-muted-foreground" />
            <div className="font-medium text-muted-foreground text-sm sm:text-base">Add New Study</div>
            <div className="text-xs sm:text-sm text-muted-foreground/75 mt-1">Create a new scripture study</div>
          </div>
        </div>
        <ScriptureSelectorModal isOpen={isOpen} onOpenChange={setIsOpen} onReferenceSelect={handleReferenceSelect} initReference={initReference} handleSubmit={createStudy}/>
      </>
    )
  }
  
  return (
    <>
      <div
        className={`flex items-center justify-between p-3 sm:p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 hover:bg-muted/25 active:bg-muted/40 cursor-pointer transition-colors touch-manipulation min-h-[60px] ${className}`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-muted-foreground text-sm sm:text-base truncate">Add New Study</div>
            <div className="text-xs sm:text-sm text-muted-foreground/75 truncate">Create a new scripture study</div>
          </div>
        </div>
        <div className="text-muted-foreground ml-2 flex-shrink-0">+</div>
      </div>
      <ScriptureSelectorModal isOpen={isOpen} onOpenChange={setIsOpen} onReferenceSelect={handleReferenceSelect} initReference={initReference} handleSubmit={createStudy}/>
    </>
  )
}
