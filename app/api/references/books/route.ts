import { NextResponse } from "next/server"
import { Handler } from "@/lib/api-handler"

// GET /api/references/books - Get books with reference counts
export async function GET() {
  try {
    const user = await Handler.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const booksWithCounts = await Handler.getBooksWithReferenceCounts()

    return NextResponse.json({
      success: true,
      books: booksWithCounts,
      count: booksWithCounts.length,
    })
  } catch (error) {
    console.error("Get books API error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to get books" }, { status: 500 })
  }
}
