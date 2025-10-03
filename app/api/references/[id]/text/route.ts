import { type NextRequest, NextResponse } from "next/server"
import { Handler } from "@/lib/api-handler"

// PUT /api/references/[id]/text - Save verse text for a reference
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await Handler.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { verseTexts } = await request.json()

    if (!Array.isArray(verseTexts)) {
      return NextResponse.json({ error: "verseTexts must be an array" }, { status: 400 })
    }

    const updatedReference = await Handler.saveVerseText(params.id, verseTexts)

    return NextResponse.json({
      success: true,
      reference: updatedReference,
    })
  } catch (error) {
    console.error("Save verse text API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save verse text" },
      { status: 500 },
    )
  }
}
