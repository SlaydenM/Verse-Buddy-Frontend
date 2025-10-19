"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BibleReference } from "@/types/bible"
import { formatReferences } from "@/lib/bible-utils"
import Flashcard from "@/components/ui/flashcard"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { ArrowLeft, ArrowRight, CornerUpRight, CornerDownLeft, Text, Lightbulb } from "lucide-react"
import clsx from "clsx"

interface QuizFlashcardProps {
  references: BibleReference[]
}

interface Verse {
  index: number
  text: string
}

export function QuizFlashcard({ references }: QuizFlashcardProps) {
  const [verses, setVerses] = useState<Verse[]>([{ index: 1, text: "" }]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<'next' | 'prev' | 'next-u' | 'prev-u'>('next');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  
  const shuffleVerses = (): Verse[] => {
    // Pair each element with its original index
    const indexedArray = references.reduce((acc: Verse[], ref: BibleReference) => (
      acc.concat(ref.text.map((text: string, index: number): Verse => ({ index, text })))
    ), []);
    
    // Fisher–Yates shuffle
    for (let i = indexedArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indexedArray[i], indexedArray[j]] = [indexedArray[j], indexedArray[i]]
    }

    setVerses(indexedArray)
    return indexedArray
  }

  const handleNext = () => {
    if (currentIndex < verses.length - 1) {
      setPrevIndex(currentIndex)
      setCurrentIndex(currentIndex + 1)
      setDirection("next")
    } else {
      setDirection("next-u")
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setPrevIndex(currentIndex)
      setCurrentIndex(currentIndex - 1)
      setDirection("prev")
    } else {
      setDirection("prev-u")
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  useEffect(() => {
    shuffleVerses()
  }, [])

  useEffect(() => {
    setIsFlipped(false)
  }, [currentIndex])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flashcard - {formatReferences(references)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-[5/3] max-w-md mx-auto">
          <div
            key={`prev-${prevIndex}`} // critical to force animation re-mount
            className={clsx(
              "absolute w-full aspect-[5/3] transition-all duration-500",
              direction === "next" ? "animate-slide-out-back" : "animate-slide-out-front",
            )}
            onAnimationEnd={() => setPrevIndex(null)} // cleanup
          >
            {prevIndex !== null && (
              <Flashcard
                front={verses[prevIndex!]?.text}
                back={`Verse ${verses[prevIndex!]?.index + 1}`}
                isFlipped={isFlipped}
                onFlip={handleFlip}
              />
            )}
          </div>
          <div
            key={`curr-${currentIndex}`} // critical to force animation re-mount
            className={clsx(
              "absolute w-full aspect-[5/3] transition-all duration-500",
              direction === "next"
                ? "animate-slide-in-front"
                : direction === "prev"
                  ? "animate-slide-in-back"
                  : direction === "next-u"
                    ? "animate-right-u"
                    : "animate-left-u",
            )}
          >
            <Flashcard
              front={verses[currentIndex].text}
              back={`Verse ${verses[currentIndex].index + 1}`}
              isFlipped={false}
              onFlip={handleFlip}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-center mx-auto my-2">
          <Button
            onClick={handlePrev}
            className="p-1 aspect-square border bg-gray-200 dark:bg-white text-gray-900 dark:text-gray-900 select-none hover:bg-gray-300 dark:hover:bg-gray-100"
          >
            <ArrowLeft size={24} />
          </Button>
          <Button
            onClick={handleNext}
            className="p-1 aspect-square border bg-gray-200 dark:bg-white text-gray-900 dark:text-gray-900 select-none hover:bg-gray-300 dark:hover:bg-gray-100"
          >
            <ArrowRight size={24} />
          </Button>
        </div>

        <div className="text-center text-gray-500 my-2">
          {currentIndex + 1} / {verses.length}
        </div>

        <div className="hidden grid grid-cols-2 grid-rows-2 w-16 aspect-square gap-0 relative">
          <div className="flex">
            <CornerUpRight className="m-auto" />
          </div>
          <div className="flex rounded-lg aspect-square bg-[#44444f] text-gray-400 -m-1 z-10">
            <Lightbulb className="m-auto" />
          </div>
          <div className="flex rounded-lg bg-[#c2c5ff] text-gray-500 -m-1 z-20">
            <Text className="m-auto" />
          </div>
          <div className="flex">
            <CornerDownLeft className="m-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
