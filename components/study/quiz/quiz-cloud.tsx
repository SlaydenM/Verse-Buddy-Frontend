"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BibleReference, BibleVerse, QuizSettings } from "@/types/bible"
import { formatReference } from "@/lib/bible-utils"
import { HelpCircle, RefreshCw } from "lucide-react"

interface QuizCloudProps {
  reference: BibleReference
  verses: BibleVerse[]
  settings: QuizSettings
  onSettingsChange: (settings: QuizSettings) => void
}

interface QuizWord {
  word: string
  isBlank: boolean
  userInput: string
  isCorrect: boolean | null
  isRevealed: boolean
  verseIndex: number
}

// Common words that should be less likely to be blanked
const COMMON_WORDS = [
  "the",
  "and",
  "of",
  "to",
  "a",
  "in",
  "that",
  "it",
  "with",
  "for",
  "as",
  "was",
  "his",
  "he",
  "be",
  "on",
  "is",
  "at",
  "by",
  "this",
  "from",
  "but",
  "not",
  "or",
  "have",
  "an",
  "they",
  "which",
  "one",
  "you",
]

export function QuizCloud({ reference, verses, settings, onSettingsChange }: QuizCloudProps) {
  const [quizWords, setQuizWords] = useState<QuizWord[][]>([])
  const [currentFocusIndex, setCurrentFocusIndex] = useState<[number, number] | null>(null)
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 })
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [isParagraphView, setIsParagraphView] = useState<boolean>(true)
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([])

  // Generate quiz on initial load and when settings change or verses change
  useEffect(() => {
    if (verses.length > 0) {
      generateQuiz()
    }
  }, [verses, settings.blankPercentage, settings.difficulty])

  // Focus on the input when currentFocusIndex changes
  useEffect(() => {
    if (currentFocusIndex) {
      const [verseIndex, wordIndex] = currentFocusIndex
      const inputElement = inputRefs.current[verseIndex]?.[wordIndex]
      if (inputElement) {
        inputElement.focus()
      }
    }
  }, [currentFocusIndex])

  const generateQuiz = useCallback(() => {
    const newQuizWords: QuizWord[][] = []
    let blankCount = 0

    // Calculate total words across all verses
    const totalWords = verses.reduce((count, verse) => count + verse.text.split(/\s+/).length, 0)

    // Calculate total blanks needed based on percentage
    const totalBlanksNeeded = Math.max(1, Math.floor((totalWords * settings.blankPercentage) / 100))

    // Create an array to track all words with their weights
    const allWords: {
      verseIndex: number
      wordIndex: number
      word: string
      weight: number
    }[] = []

    // First pass: collect all words and assign weights
    verses.forEach((verse, verseIndex) => {
      const words = verse.text.split(/\s+/)

      words.forEach((word, wordIndex) => {
        // Assign lower weight to common words and very short words
        const lowerCaseWord = word.toLowerCase().replace(/[.,;:!?'")\]]+$/, "")
        let weight = 1.0

        // Lower weight for common words
        if (COMMON_WORDS.includes(lowerCaseWord)) {
          weight = 0.3
        }

        // Lower weight for very short words
        if (lowerCaseWord.length <= 2) {
          weight *= 0.2
        }

        // Don't blank out punctuation
        if (/^[.,;:!?'")\]]+$/.test(word)) {
          weight = 0
        }

        allWords.push({ verseIndex, wordIndex, word, weight })
      })
    })

    // Sort by weight (higher weights first) and filter out zero weights
    const sortedWords = allWords.filter((item) => item.weight > 0).sort((a, b) => b.weight - a.weight)

    // Take the top N words based on totalBlanksNeeded
    const wordsToBlank = sortedWords.slice(0, totalBlanksNeeded)

    // Create a Set of verse/word indices to blank
    const indicesToBlank = new Set(wordsToBlank.map((item) => `${item.verseIndex}-${item.wordIndex}`))

    // Second pass: create the quiz words structure
    verses.forEach((verse, verseIndex) => {
      const words = verse.text.split(/\s+/)
      const verseWords: QuizWord[] = []

      words.forEach((word, wordIndex) => {
        const isBlank = indicesToBlank.has(`${verseIndex}-${wordIndex}`)
        verseWords.push({
          word,
          isBlank,
          userInput: "",
          isCorrect: null,
          isRevealed: false,
          verseIndex,
        })

        if (isBlank) blankCount++
      })

      newQuizWords.push(verseWords)
    })

    // Initialize the inputRefs array with the same structure as quizWords
    inputRefs.current = newQuizWords.map((verse) => verse.map(() => null))

    setQuizWords(newQuizWords)
    setScore({ correct: 0, total: blankCount })
    setCurrentFocusIndex(null)
  }, [verses, settings.blankPercentage])

  const handleInputChange = (verseIndex: number, wordIndex: number, value: string) => {
    const newQuizWords = [...quizWords]
    newQuizWords[verseIndex][wordIndex].userInput = value
    setQuizWords(newQuizWords)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, verseIndex: number, wordIndex: number) => {
    if (e.key === "Enter") {
      checkWord(verseIndex, wordIndex)
      e.preventDefault()
      findNextBlank(verseIndex, wordIndex)
    } else if (e.key === "Tab") {
      // Find next blank
      e.preventDefault()
      findNextBlank(verseIndex, wordIndex, !e.shiftKey)
    }
  }

  const findNextBlank = (verseIndex: number, wordIndex: number, forward = true) => {
    const totalVerses = quizWords.length

    if (totalVerses === 0) return

    if (forward) {
      // Search forward
      for (let v = verseIndex; v < totalVerses; v++) {
        const startWordIndex = v === verseIndex ? wordIndex + 1 : 0
        for (let w = startWordIndex; w < quizWords[v].length; w++) {
          if (quizWords[v][w].isBlank && !quizWords[v][w].isRevealed && quizWords[v][w].isCorrect !== true) {
            setCurrentFocusIndex([v, w])
            return
          }
        }
      }

      // Wrap around to beginning
      for (let v = 0; v <= verseIndex; v++) {
        const endWordIndex = v === verseIndex ? wordIndex : quizWords[v].length
        for (let w = 0; w < endWordIndex; w++) {
          if (quizWords[v][w].isBlank && !quizWords[v][w].isRevealed && quizWords[v][w].isCorrect !== true) {
            setCurrentFocusIndex([v, w])
            return
          }
        }
      }
    } else {
      // Search backward
      for (let v = verseIndex; v >= 0; v--) {
        const startWordIndex = v === verseIndex ? wordIndex - 1 : quizWords[v].length - 1
        for (let w = startWordIndex; w >= 0; w--) {
          if (quizWords[v][w].isBlank && !quizWords[v][w].isRevealed && quizWords[v][w].isCorrect !== true) {
            setCurrentFocusIndex([v, w])
            return
          }
        }
      }

      // Wrap around to end
      for (let v = totalVerses - 1; v >= verseIndex; v--) {
        const endWordIndex = v === verseIndex ? wordIndex : 0
        for (let w = quizWords[v].length - 1; w >= endWordIndex; w--) {
          if (quizWords[v][w].isBlank && !quizWords[v][w].isRevealed && quizWords[v][w].isCorrect !== true) {
            setCurrentFocusIndex([v, w])
            return
          }
        }
      }
    }
  }

  const checkWord = (verseIndex: number, wordIndex: number) => {
    const newQuizWords = [...quizWords]
    const word = newQuizWords[verseIndex][wordIndex]

    if (word.isBlank && !word.isRevealed) {
      // Case insensitive comparison, ignoring punctuation
      const normalizedInput = word.userInput.toLowerCase().replace(/[.,;:!?'")\]]+$/, "")
      const normalizedWord = word.word.toLowerCase().replace(/[.,;:!?'")\]]+$/, "")

      const isCorrect = normalizedInput === normalizedWord
      word.isCorrect = isCorrect

      // Update score
      if (isCorrect && word.isCorrect === null) {
        setScore((prev) => ({ ...prev, correct: prev.correct + 1 }))
      }

      setQuizWords(newQuizWords)
    }
  }

  const revealWord = (verseIndex: number, wordIndex: number) => {
    const newQuizWords = [...quizWords]
    const word = newQuizWords[verseIndex][wordIndex]

    if (word.isBlank && !word.isRevealed) {
      word.isRevealed = true
      word.userInput = word.word
      word.isCorrect = false

      setQuizWords(newQuizWords)

      // Find next blank
      findNextBlank(verseIndex, wordIndex)
    }
  }

  const handleSettingsChange = (newSettings: Partial<QuizSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    onSettingsChange(updatedSettings)
  }

  const getProgressPercentage = () => {
    if (score.total === 0) return 0
    return Math.round((score.correct / score.total) * 100)
  }

  // Create a reference string that shows the verse range
  const getVerseRangeReference = () => {
    if (verses.length === 0) return formatReference(reference)

    const startVerse = verses[0].verse
    const endVerse = verses[verses.length - 1].verse

    return formatReference({
      ...reference,
      startVerse,
      endVerse,
    })
  }

  const handleParagraphViewChange = (checked: boolean) => {
    setIsParagraphView(checked)
  }

  // Render quiz content based on paragraph view setting
  const renderQuizContent = () => {
    if (isParagraphView) {
      return (
        <div className="prose dark:prose-invert max-w-none">
          <p className="leading-relaxed">
            {quizWords.map((verseWords, verseIndex) => (
              <span key={verseIndex}>
                <span className="font-bold text-sm align-super mr-1">{verses[verseIndex].verse}</span>
                {verseWords.map((wordObj, wordIndex) => (
                  <span key={`${verseIndex}-${wordIndex}`} className="inline-block mx-0.5">
                    {wordObj.isBlank ? (
                      <span className="inline-flex items-center">
                        <Input
                          type="text"
                          value={wordObj.userInput}
                          onChange={(e) => handleInputChange(verseIndex, wordIndex, e.target.value)}
                          onKeyDown={(e) => handleInputKeyDown(e, verseIndex, wordIndex)}
                          onBlur={() => checkWord(verseIndex, wordIndex)}
                          ref={(el) => {
                            if (inputRefs.current[verseIndex]) {
                              inputRefs.current[verseIndex][wordIndex] = el
                            }
                          }}
                          className={`w-24 inline-block px-1 py-0 h-7 text-center ${
                            wordObj.isRevealed
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                              : wordObj.isCorrect === true
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                : wordObj.isCorrect === false
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                                  : ""
                          }`}
                        />
                        {!wordObj.isRevealed && !wordObj.isCorrect && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1"
                            onClick={() => revealWord(verseIndex, wordIndex)}
                          >
                            <HelpCircle className="h-3 w-3" />
                            <span className="sr-only">Reveal</span>
                          </Button>
                        )}
                      </span>
                    ) : (
                      wordObj.word
                    )}
                  </span>
                ))}{" "}
              </span>
            ))}
          </p>
        </div>
      )
    } else {
      return (
        <div className="space-y-4">
          {quizWords.map((verseWords, verseIndex) => (
            <div key={verseIndex} className="prose dark:prose-invert max-w-none">
              <p className="leading-relaxed">
                <span className="font-bold text-sm align-super mr-1">{verses[verseIndex].verse}</span>
                {verseWords.map((wordObj, wordIndex) => (
                  <span key={wordIndex} className="inline-block mx-0.5">
                    {wordObj.isBlank ? (
                      <span className="inline-flex items-center">
                        <Input
                          type="text"
                          value={wordObj.userInput}
                          onChange={(e) => handleInputChange(verseIndex, wordIndex, e.target.value)}
                          onKeyDown={(e) => handleInputKeyDown(e, verseIndex, wordIndex)}
                          onBlur={() => checkWord(verseIndex, wordIndex)}
                          ref={(el) => {
                            if (inputRefs.current[verseIndex]) {
                              inputRefs.current[verseIndex][wordIndex] = el
                            }
                          }}
                          className={`w-24 inline-block px-1 py-0 h-7 text-center ${
                            wordObj.isRevealed
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                              : wordObj.isCorrect === true
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                : wordObj.isCorrect === false
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                                  : ""
                          }`}
                        />
                        {!wordObj.isRevealed && !wordObj.isCorrect && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1"
                            onClick={() => revealWord(verseIndex, wordIndex)}
                          >
                            <HelpCircle className="h-3 w-3" />
                            <span className="sr-only">Reveal</span>
                          </Button>
                        )}
                      </span>
                    ) : (
                      wordObj.word
                    )}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      )
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{getVerseRangeReference()}</CardTitle>
            <CardDescription>Fill in the blanks to test your memorization</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
              Settings
            </Button>
            <Button variant="outline" size="icon" onClick={generateQuiz}>
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Reset Quiz</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isSettingsOpen && (
            <div className="mb-6 p-4 border rounded-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={settings.difficulty}
                  onValueChange={(value) => {
                    const percentages = { easy: 10, medium: 15, hard: 25 }
                    handleSettingsChange({
                      difficulty: value as "easy" | "medium" | "hard",
                      blankPercentage: percentages[value as "easy" | "medium" | "hard"],
                    })
                  }}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy (10% blanks)</SelectItem>
                    <SelectItem value="medium">Medium (15% blanks)</SelectItem>
                    <SelectItem value="hard">Hard (25% blanks)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="blankPercentage">Blank Percentage</Label>
                  <span className="text-sm text-muted-foreground">{settings.blankPercentage}%</span>
                </div>
                <Slider
                  id="blankPercentage"
                  min={5}
                  max={50}
                  step={5}
                  value={[settings.blankPercentage]}
                  onValueChange={(value) => handleSettingsChange({ blankPercentage: value[0] })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="paragraph-mode-quiz"
                  checked={isParagraphView}
                  onCheckedChange={handleParagraphViewChange}
                />
                <Label htmlFor="paragraph-mode-quiz">Paragraph View</Label>
              </div>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-medium">
              Progress: {score.correct}/{score.total} ({getProgressPercentage()}%)
            </div>
            <div className="h-2 w-full max-w-xs bg-muted rounded-full overflow-hidden ml-4">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">{renderQuizContent()}</div>
        </CardContent>
      </Card>
    </div>
  )
}
