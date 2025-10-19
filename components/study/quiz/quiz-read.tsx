"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BibleReference } from "@/types/bible"
import { formatReference, formatReferences } from "@/lib/bible-utils"
import React from "react"

interface QuizReadProps {
  references: BibleReference[]
}

export function QuizRead({ references }: QuizReadProps) {
  const formatPassage = (reference: BibleReference) => {
    const headingKeys = reference.headings ? Object.keys(reference.headings) : []

    return reference.text.map((verse, i) => {
      const startsWithNewline = verse.startsWith("\n")
      const lines = (startsWithNewline ? verse.slice(1) : verse).split("\n") // Split verse into lines by '\n'
      
      return (
        <span key={i}>
          {/* Heading */}
          {headingKeys.includes("" + (i + 1)) ? (
            <span key={`h${i + 1}`} className="block py-3 text-xl font-bold">
              {reference.headings[i + 1]}
            </span>
          ) : (
            startsWithNewline && <br />
          )}

          {/* Verse */}
          <span style={startsWithNewline ? { marginLeft: "1rem" } : {}}>
            {/* Number */}
            <span className="px-[0.15rem] text-xs text-gray-400 align-super">{i + reference.startVerse}</span>

            {/* Lines */}
            {lines.map((line, j) => (
              <React.Fragment key={j}>
                {j > 0 && ( // Indent
                  <>
                    <br />
                    <span style={{ marginLeft: "1rem" }} />
                  </>
                )}
                {line.trim()}
              </React.Fragment>
            ))}
          </span>
        </span>
      )
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Read - {formatReferences(references)}</CardTitle>
      </CardHeader>
      <CardContent>
        {references.length === 1 ? (
          <p>{formatPassage(references[0])}</p>
        ) : (
          <>
            {references.map((ref, index) => (
              <div key={index}>
                <div className="flex items-center gap-3 mt-4 ml-2 sm:-ml-3 text-gray-500 dark:text-gray-400">
                  <span className="text-sm font-medium whitespace-nowrap">{formatReference(ref)}</span>
                  <div className="flex-1 border-b border-gray-300 dark:border-gray-600" />
                </div>
                <p>{formatPassage(ref)}</p>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  )
}
