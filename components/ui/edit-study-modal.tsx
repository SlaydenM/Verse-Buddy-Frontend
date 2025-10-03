"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ChapterGrid } from "@/components/ui/chapter-grid"
import type { BibleReference } from "@/types/bible"
import { bibleVersions, bibleBooks, getChapterCount, getVerseCount } from "@/lib/bible-data"
import { apiClient } from "@/lib/api-client"
import { Loader2, Edit, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScriptureSelectorModal } from "../study/scripture-selector-modal"

interface EditStudyModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  reference: BibleReference
  // onReferenceUpdated: () => void
  initBook?: string
  initChapter?: number
}

export function EditStudyModal({
  isOpen,
  onOpenChange,
  reference,
  // onReferenceUpdated,
}: EditStudyModalProps) {
  const updateStudy = async (reference: BibleReference): Promise<{result: BibleReference, success: string}> => {
    console.log("Editing study with reference:", reference)
      
    // Save the reference to the database via API
    const result = await apiClient.updateReference(reference.id, reference)
    console.log("Reference updated in database:", result.reference)
    
    // Show success message
    return { result: result.reference, success: "Successfully updated reference!"}
  }
  
  return <ScriptureSelectorModal isOpen={isOpen} onOpenChange={onOpenChange} onReferenceSelect={() => null} initReference={reference} handleSubmit={updateStudy}/>
}