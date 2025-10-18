"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api-client"
import { fetchVerses } from "@/lib/bible-api"
import { formatReference } from "@/lib/bible-utils"
import type { BibleReference, BibleVerse } from "@/types/bible"
import { AlertCircle, ArrowLeft, Loader2, Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
// import { URLSearchParams } from "next/dist/compiled/@edge-runtime/primitives/url"

import dynamic from 'next/dynamic'

const QuizRead = dynamic(() => import('@/components/study/quiz/quiz-read').then(m => m.QuizRead), { ssr: false })
const QuizReveal = dynamic(() => import('@/components/study/quiz/quiz-reveal').then(m => m.QuizReveal), { ssr: false })
const QuizCloud = dynamic(() => import('@/components/study/quiz/quiz-cloud').then(m => m.QuizCloud), { ssr: false })
const QuizFlashcard = dynamic(() => import('@/components/study/quiz/quiz-flashcard').then(m => m.QuizFlashcard), { ssr: false })
const QuizType = dynamic(() => import('@/components/study/quiz/quiz-type').then(m => m.QuizType), { ssr: false })
const QuizSpeak = dynamic(() => import('@/components/study/quiz/quiz-speak').then(m => m.QuizSpeak), { ssr: false })
const QuizMatch = dynamic(() => import('@/components/study/quiz/quiz-match').then(m => m.QuizMatch), { ssr: false })
const QuizPhrase = dynamic(() => import('@/components/study/quiz/quiz-phrase').then(m => m.QuizPhrase), { ssr: false })

interface OptionDTO {
  value: string, 
  label: string,
  disabled?: boolean,
}

interface StudyProps {
  searchParams: {
    referenceId?: string,
    quizType?: string
  }
}

export function Study({ searchParams }: StudyProps) {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState(searchParams.quizType || "read")
  const [reference, setReference] = useState<BibleReference | null>(null)
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get referenceId from props or URL params
  const currentReferenceId = searchParams.referenceId
  
  const handleBackClick = () => {
    router.back()
  }

  useEffect(() => {
    if (!currentReferenceId) {
      setIsLoading(false);
      return;
    }
    
    let isActive = true; // flag to prevent state updates after unmount or stale calls
    
    const loadReference = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Fetching reference with ID:", currentReferenceId);
        const result = await apiClient.getReference(currentReferenceId);
        
        console.log("found");
        if (!isActive) return; // ignore result if component unmounted or ID changed
        
        if (!result || !result.reference) {
          throw new Error("Reference not found");
        }
        
        const fetchedReference = result.reference;
        setReference(fetchedReference);
        
        console.log("checkz");
        if (fetchedReference.text && fetchedReference.text.length > 0) {
          // Use stored text
          const storedVerses: BibleVerse[] = fetchedReference.text.map((text: string, index: number) => ({
            verse: fetchedReference.startVerse + index,
            text: text.trim(),
          }));
          setVerses(storedVerses);
          console.log("Using stored verse text:", storedVerses);
        } else {
          // Fetch verses from external Bible API
          console.log("Fetching verses from Bible API for:", fetchedReference);
          const fetchedVerses = await fetchVerses(fetchedReference);
          if (isActive) {
            setVerses(fetchedVerses);
            console.log("Fetched verses from API:", fetchedVerses);
          }
        }
      } catch (err) {
        if (isActive) {
          console.error("Error loading reference:", err);
          setError(err instanceof Error ? err.message : "Failed to load reference");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadReference();
    
    return () => {
      isActive = false; // cleanup on unmount or dep change
    };
  }, [currentReferenceId]);
  
  
  const menuOptions: OptionDTO[] = [
    { value: "read", label: "Read" },
    { value: "reveal", label: "Reveal" },
    { value: "cloud", label: "Cloud", disabled: true },
    { value: "flashcard", label: "Flashcard" },
    { value: "type", label: "Type" },
    { value: "speak", label: "Speak", disabled: true },
    { value: "match", label: "Match", disabled: true },
    { value: "phrase", label: "Phrase" }
  ]
  
  const selectedOptionLabel = menuOptions.find((option) => option.value === selectedOption)?.label
  
  const renderContent = () => {
    if (!reference) return null
    
    switch (selectedOption) {
      case "read":
        return <QuizRead reference={reference} />
      case "reveal":
        return <QuizReveal reference={reference} />
      case "cloud":
        return (
          <QuizCloud
            reference={reference}
            verses={verses}
            settings={{ difficulty: "medium", blankPercentage: 15 }}
            onSettingsChange={() => {}}
          />
        )
      case "flashcard":
        return <QuizFlashcard reference={reference} />
      case "type":
        return <QuizType reference={reference} />
      case "speak":
        return <QuizSpeak reference={reference} />
      case "match":
        return <QuizMatch reference={reference} />
      case "phrase":
        return <QuizPhrase reference={reference} />
      default:
        return <QuizRead reference={reference} />
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading study...</span>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }
  
  if (!currentReferenceId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Study</h1>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No reference ID provided. Please select a study from your dashboard or provide a referenceId parameter.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  if (!reference) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No reference found. Please check the reference ID and try again.</AlertDescription>
        </Alert>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button className="border" variant="ghost" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Study</h1>
            <p className="text-muted-foreground mt-1">{formatReference(reference)}</p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {menuOptions.map((option) => (
              (option.disabled) ? (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => null}
                  className={`${selectedOption === option.value ? "bg-accent" : ""} text-gray-500`}
                >
                  {option.label} (Coming Soon)
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSelectedOption(option.value)}
                  className={selectedOption === option.value ? "bg-accent" : ""}
                >
                  {option.label}
                </DropdownMenuItem>
              )
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* <div className="text-sm text-muted-foreground mb-4">
        Currently viewing: {selectedOptionLabel}
        {verses.length > 0 && ` • ${verses.length} verses loaded`}
      </div> */}
      
      {renderContent()}
    </div>
  )
}
