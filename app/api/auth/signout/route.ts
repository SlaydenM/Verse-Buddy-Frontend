import { Handler } from "@/lib/api-handler"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    console.log("supa signing out")
    await Handler.signOut()
    
    const res = NextResponse.json({ success: true })
    res.cookies.set("sb-access-token", "", { httpOnly: true, path: "/", maxAge: 0 })
    res.cookies.set("sb-refresh-token", "", { httpOnly: true, path: "/", maxAge: 0 })
    return res
  } catch (err) {
    console.error("Signout error:", err)
    return NextResponse.json({ success: false, error: "Signout failed" }, { status: 500 })
  }
}
