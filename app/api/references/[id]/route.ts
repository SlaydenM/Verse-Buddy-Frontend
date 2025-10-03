import { Handler } from "@/lib/api-handler";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/references/[id] - Get a specific reference
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await Handler.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Note: params may be a Promise-like object in Next.js route handlers — await before using its properties
    const { id } = await params;
    
    // Note: We'd need to add a getReference method to Handler class
    // For now, we'll get all references and filter
    const references = await Handler.getAllReferences()
    const reference = references.find((ref) => ref.id === id)
    
    if (!reference) {
      return NextResponse.json({ error: "Reference not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      reference,
    })
  } catch (error) {
    console.error("Get reference API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get reference" },
      { status: 500 },
    )
  }
}

// POST /api/references/[id] - Update a reference
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await Handler.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    const { id } = await params;
    const updates = await request.json()
    const updatedReference = await Handler.updateReference(id, updates)
    
    return NextResponse.json({
      success: true,
      reference: updatedReference,
    })
  } catch (error) {
    console.error("Update reference API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update reference" },
      { status: 500 },
    )
  }
}

// DELETE /api/references/[id] - Delete a reference
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await Handler.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params;

    await Handler.deleteReference(id)

    return NextResponse.json({
      success: true,
      message: "Reference deleted successfully",
    })
  } catch (error) {
    console.error("Delete reference API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete reference" },
      { status: 500 },
    )
  }
}
