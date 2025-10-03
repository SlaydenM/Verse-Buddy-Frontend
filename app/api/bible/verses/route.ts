import { type NextRequest, NextResponse } from "next/server"
import { fetchVerses } from "@/lib/bible-api"
import type { BibleReference } from "@/types/bible"

// POST /api/bible/verses - Fetch verses from Bible API
export async function POST(request: NextRequest) {
  try {
    const referenceData = await request.json()
    
    // Validate required fields
    const { version, book, chapter, startVerse, endVerse, finalVerse } = referenceData
    if (!version || !book || !chapter) {
      return NextResponse.json({ error: "Missing required fields: version, book, chapter" }, { status: 400 })
    }
    
    const reference: BibleReference = {
      id: "1",
      version,
      book,
      chapter: Number(chapter),
      startVerse: Number(startVerse) || 1,
      endVerse: Number(endVerse) || Number(finalVerse) || 30,
      finalVerse: Number(finalVerse) || 30,
    }
    
    const verses = await fetchVerses(reference)
    
    return NextResponse.json({
      success: true,
      reference,
      verses,
      count: verses.length,
    })
  } catch (error) {
    console.error("Fetch verses API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch verses" },
      { status: 500 },
    )
  }
}
