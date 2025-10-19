"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api-client"
import { fetchVerses } from "@/lib/bible-api"
import { formatReferences } from "@/lib/bible-utils"
import type { BibleReference, BibleVerse } from "@/types/bible"
import { AlertCircle, ArrowLeft, Loader2, Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
// import { URLSearchParams } from "next/dist/compiled/@edge-runtime/primitives/url"

import dynamic from 'next/dynamic'
import { BookType } from "@/lib/bible-data"

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
  coming?: boolean,
  disabled?: boolean
}

interface StudyProps {
  searchParams: {
    referenceId?: string,
    quizType?: string,
    book?: BookType,
    chapter?: number
  }
}

export function Study({ searchParams }: StudyProps) {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState(searchParams.quizType || "read")
  const [references, setReferences] = useState<BibleReference[] | null>(null)
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get referenceId from props or URL params
  const referenceId = searchParams.referenceId;
  const book = searchParams.book;
  const chapter = searchParams.chapter;
  
  const handleBackClick = () => {
    router.back()
  }
  
  useEffect(() => { loadReferences() }, [referenceId]);
  
  const loadReferences = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      var result;
      if (referenceId) {
        console.log("Fetching reference with ID:", referenceId);
        result = await apiClient.getReference(referenceId);
        if (!result) throw new Error("Reference not found");
        setReferences([result.reference]);
      } else if (book) {
        if (chapter) {
          console.log("Fetching reference with book and chapter:", book, chapter);
          result = await apiClient.getReferencesByChapter(book, chapter);
        } else {
          console.log("Fetching reference with book:", book);
          result = await apiClient.getReferencesByBook(book);
        }
        if (!result) throw new Error("References not found");
        setReferences(result.references);
      } else {
        console.log("Fetching all references");
        result = await apiClient.getAllReferences();
        if (!result) throw new Error("References not found");
        setReferences(result.references);
      }
    } catch (err) {
      console.error("Error loading reference:", err);
      setError(err instanceof Error ? err.message : "Failed to load reference");
    } finally {
      setIsLoading(false);
    }
  }
  
  // const title = (chapter) ? (book + " " + 2) || (book ? (book + " " + 2) : (references && formatReferences(references)));
  let title: string;
  if (book) {
    if (chapter) {
      title = book + " " + chapter; 
    } else {
      title = book;
    }
  } else if (references) {
    title = formatReferences(references)
  } else {
    title = "Empty study";
  }
  
  const menuOptions: OptionDTO[] = [
    { value: "read", label: "Read" },
    { value: "reveal", label: "Reveal" },
    { value: "cloud", label: "Cloud", coming: true },
    { value: "flashcard", label: "Flashcard" },
    { value: "type", label: "Type" },
    { value: "speak", label: "Speak", coming: true },
    { value: "match", label: "Match", coming: true },
    { value: "phrase", label: "Phrase" }
  ]
  
  // Disable options according to references
  const menuItemsAllowedAll = [3, 7] // Phrase, flashcard
  const menuItemsAllowedBook = [0, 3, 7] // Read, phrase, flashcard
  if (book) {
    menuOptions.forEach((o, i) => {
      o.disabled = !menuItemsAllowedBook.includes(i);
    })
  } else if (!chapter && !referenceId) {
    menuOptions.forEach((o, i) => {
      o.disabled = !menuItemsAllowedAll.includes(i);
    })
  }

  const renderContent = () => {
    if (!references || references.length === 0) return null
    
    switch (selectedOption) {
      case "read":
        return <QuizRead references={references} />
      case "reveal":
        return <QuizReveal reference={references[0]} />
      case "cloud":
        return (
          <QuizCloud
            reference={references[0]}
            verses={verses}
            settings={{ difficulty: "medium", blankPercentage: 15 }}
            onSettingsChange={() => {}}
          />
        )
      case "flashcard":
        return <QuizFlashcard references={references} />
      case "type":
        return <QuizType reference={references[0]} />
      case "speak":
        return <QuizSpeak reference={references[0]} />
      case "match":
        return <QuizMatch reference={references[0]} />
      case "phrase":
        return <QuizPhrase references={references} />
      default:
        return <QuizRead references={references} />
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
  
  if (!references || references.length === 0) {
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
            <p className="text-muted-foreground mt-1">{title}</p>
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
              (!option.disabled) && (
                (option.coming) ? (
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
              )
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {renderContent()}
    </div>
  )
}
