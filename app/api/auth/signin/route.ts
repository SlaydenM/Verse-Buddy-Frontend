import { Handler } from "@/lib/api-handler"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    const result = await Handler.signIn(email, password)
    const session = result?.session

    const res = NextResponse.json({ success: true, session, user: result?.user ?? null })

    // If we received a session from the Handler, store tokens in secure HttpOnly cookies on the response
    if (session?.access_token) {
      res.cookies.set("sb-access-token", session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: session.expires_in ?? 3600,
      })
    }

    if (session?.refresh_token) {
      res.cookies.set("sb-refresh-token", session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    return res
  } catch (err) {
    console.error("Signin error:", err)
    return NextResponse.json({ success: false, error: "Signin failed" }, { status: 500 })
  }
}
