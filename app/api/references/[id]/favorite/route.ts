import { Handler } from "@/lib/api-handler";
import { type NextRequest, NextResponse } from "next/server";

// Note: params may be a Promise-like object in Next.js route handlers — await before using its properties

// POST /api/references/[id]/favorite - Toggle favorite status
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await Handler.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    const { id } = await params;
    const updatedReference = await Handler.toggleFavorite(id)
    
    return NextResponse.json({
      success: true,
      reference: updatedReference,
      isFavorite: updatedReference.isFavorite,
    })
  } catch (error) {
    console.error("Toggle favorite API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to toggle favorite" },
      { status: 500 },
    )
  }
}
