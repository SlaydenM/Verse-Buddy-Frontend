import { type NextRequest, NextResponse } from "next/server"
import { Handler } from "@/lib/api-handler"
import type { BibleReference } from "@/types/bible"

// GET /api/references - Get all references for current user
export async function GET(request: NextRequest) {
  try {
    const user = await Handler.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const references = await Handler.getAllReferences()

    return NextResponse.json({
      success: true,
      references,
      count: references.length,
    })
  } catch (error) {
    console.error("Get references API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get references" },
      { status: 500 },
    )
  }
}

// POST /api/references - Create a new reference
export async function POST(request: NextRequest) {
  try {
    const user = await Handler.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const referenceData = await request.json()

    // Validate required fields
    const { version, book, chapter, startVerse, endVerse, finalVerse } = referenceData
    if (!version || !book || !chapter || !startVerse || !endVerse || !finalVerse) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    const reference: BibleReference = {
      id: "",
      version,
      book,
      chapter: Number(chapter),
      startVerse: Number(startVerse),
      endVerse: Number(endVerse),
      finalVerse: Number(finalVerse),
      isFavorite: referenceData.isFavorite || false,
      text: referenceData.text || null,
      headings: referenceData.headings || null,
    }

    const savedReference = await Handler.addReference(reference)

    return NextResponse.json(
      {
        success: true,
        reference: savedReference,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create reference API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create reference" },
      { status: 500 },
    )
  }
}
