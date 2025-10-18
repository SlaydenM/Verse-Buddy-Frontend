"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BibleReference } from "@/types/bible"
import { formatReference } from "@/lib/bible-utils"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface QuizPhraseProps {
  reference: BibleReference
}

export function QuizPhrase({ reference }: QuizPhraseProps) {
  const [phraseData, setPhraseData] = useState({ verseNum: 1, phrase: "", rest: "" })
  const [isRestVisible, setIsRestVisible] = useState(false)

  const formatPhrase = () => {
    const { verseNum, phrase, rest } = phraseData

    return (
      <span>
        <span className="px-[0.15rem] text-xs text-gray-400 align-super">{verseNum}</span>
        <span>
          <span className="text-gray-400">
            {reference.text[verseNum - 1].split(" ").slice(0, 3).join(" ").trim() !==
              phrase.split(" ").slice(0, 3).join(" ").trim() && ".."}
          </span>
          {phrase.trim()}
          <span
            className={`
              absolute
              text-gray-400
              transition-opacity duration-200
              ${!isRestVisible ? "opacity-100" : "opacity-0"}
            `}
          >
            {".."}
          </span>
        </span>
        <span
          className={`
            text-green-600
            transition-opacity duration-200
            ${isRestVisible ? "opacity-100" : "opacity-0"}
          `}
        >
          {rest}
        </span>
      </span>
    )
  }

  const splitPhrases = (verseContent: string): string[] => {
    // Match "any sequence of non-punctuation followed by optional punctuation"
    const regex = /[^.,!?;:()'"""]+[.,!?;:()'"""]*/g // Split by punctuation
    const matches = verseContent.match(regex)
    return matches ? matches.map((s) => s.trim()) : []
  }

  const generateNewPhraseData = () => {
    const verseIndex = Math.floor(Math.random() * reference.text.length)
    const verseContent = reference.text[verseIndex]

    // Split and retain punctuation
    const phrases = splitPhrases(verseContent)
    console.log(phrases)
    if (phrases.length > 1) phrases.pop()

    // Choose random phrase
    let phraseIndex = Math.floor(Math.random() * phrases.length)
    let phrase = phrases[phraseIndex++]
    console.log(phraseIndex)
    if (phrase.split(" ").length <= 4 && phraseIndex < phrases.length) {
      phrase += " " + phrases[phraseIndex++] // Merge with next if too short
    }

    // Format phrase by trimming, add rest of verse
    console.log(phrase)
    const phraseWords = phrase.split(" ")
    const endIndex =
      phraseIndex === phrases.length // If not room for rest of verse
        ? -1 // Last word will be rest
        : Math.max(4, phraseWords.length - 1 - 4)
    phrase = phraseWords.slice(0, endIndex).join(" ")
    const rest = verseContent.split(phrase).at(-1) || ""

    return {
      verseNum: verseIndex + 1,
      phrase: phrase,
      rest,
    }
  }

  const updatePhraseData = () => {
    setIsRestVisible(false)
    if (isRestVisible) {
      setTimeout(() => setPhraseData(generateNewPhraseData()), 200)
    } else {
      setPhraseData(generateNewPhraseData())
    }
  }

  const toggleRest = () => {
    setIsRestVisible(!isRestVisible)
  }

  useEffect(updatePhraseData, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phrase - {formatReference(reference)}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={updatePhraseData}
            className="py-2 mb-2 border bg-gray-200 dark:bg-white text-gray-900 dark:text-gray-900 hover:bg-gray-300 dark:hover:bg-gray-100"
          >
            New
          </Button>
          <Button
            onClick={toggleRest}
            className="py-2 mb-2 border bg-gray-200 dark:bg-white text-gray-900 dark:text-gray-900 hover:bg-gray-300 dark:hover:bg-gray-100"
          >
            {isRestVisible ? "Hide" : "Reveal"}
          </Button>
        </div>

        {/* Passage */}
        <p>{formatPhrase()}</p>
      </CardContent>
    </Card>
  )
}
