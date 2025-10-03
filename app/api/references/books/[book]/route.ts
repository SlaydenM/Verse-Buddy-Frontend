import { type NextRequest, NextResponse } from "next/server"
import { Handler } from "@/lib/api-handler"

// GET /api/references/books/[book] - Get references for a specific book
export async function GET(request: NextRequest, { params }: { params: { book: string } }) {
  try {
    const user = await Handler.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    const book = decodeURIComponent(params.book)
    const references = await Handler.getReferencesByBook(book)

    return NextResponse.json({
      success: true,
      book,
      references,
      count: references.length,
    })
  } catch (error) {
    console.error("Get book references API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get book references" },
      { status: 500 },
    )
  }
}
