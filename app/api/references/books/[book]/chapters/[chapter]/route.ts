import { type NextRequest, NextResponse } from "next/server"
import { Handler } from "@/lib/api-handler"

// GET /api/references/books/[book]/chapters/[chapter] - Get references for a specific chapter
export async function GET(request: NextRequest, { params }: { params: { book: string; chapter: string } }) {
  try {
    const user = await Handler.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const book = decodeURIComponent(params.book)
    const chapter = Number.parseInt(params.chapter)

    if (isNaN(chapter)) {
      return NextResponse.json({ error: "Invalid chapter number" }, { status: 400 })
    }

    const references = await Handler.getReferencesByChapter(book, chapter)

    return NextResponse.json({
      success: true,
      book,
      chapter,
      references,
      count: references.length,
    })
  } catch (error) {
    console.error("Get chapter references API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get chapter references" },
      { status: 500 },
    )
  }
}
