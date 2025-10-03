"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BibleReference } from "@/types/bible"
import { formatReference } from "@/lib/bible-utils"

interface QuizMatchProps {
  reference: BibleReference
}

export function QuizMatch({ reference }: QuizMatchProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Match - {formatReference(reference)}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Match mode component for {formatReference(reference)}. This will provide word/phrase matching exercises.
        </p>
      </CardContent>
    </Card>
  )
}
