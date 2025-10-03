import { type NextRequest, NextResponse } from "next/server"
import { Handler } from "@/lib/api-handler"

// GET /api/references/books/[book]/chapters - Get chapters with reference counts for a book
export async function GET(request: NextRequest, { params }: { params: { book: string } }) {
  try {
    const user = await Handler.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const book = decodeURIComponent(params.book)
    const chaptersWithCounts = await Handler.getChaptersWithReferenceCounts(book)

    return NextResponse.json({
      success: true,
      book,
      chapters: chaptersWithCounts,
      count: chaptersWithCounts.length,
    })
  } catch (error) {
    console.error("Get chapters API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get chapters" },
      { status: 500 },
    )
  }
}
