import { NextResponse } from "next/server"
import { Handler } from "@/lib/api-handler"

// GET /api/references/favorites - Get all favorite references
export async function GET() {
  try {
    const user = await Handler.getCurrentUser()
    console.log("Get favorites for user:", user)
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    const favorites = await Handler.getFavoriteReferences()

    return NextResponse.json({
      success: true,
      favorites,
      count: favorites.length,
    })
  } catch (error) {
    console.error("Get favorites API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get favorites" },
      { status: 500 },
    )
  }
}
