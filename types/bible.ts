import { BookType } from "@/lib/bible-data"

export interface BibleReference {
  id: string
  version: string
  book: BookType
  chapter: number
  startVerse: number
  endVerse: number
  finalVerse?: number | null
  isFavorite?: boolean
  text: string[]
  headings: { [verseNum: number]: string}
  createdAt?: string
  updatedAt?: string
}

export interface BibleVerse {
  verse: number
  text: string
}

export interface QuizSettings {
  difficulty: "easy" | "medium" | "hard"
  blankPercentage: number
}
