import type { BibleReference, BibleVerse } from "@/types/bible"
import { createClient } from "@/utils/supabase/client"

class ApiClient {
  private baseUrl: string
  
  constructor() {
    // Auto-detect the base URL
    if (typeof window !== "undefined") {
      // Client-side: use current origin
      this.baseUrl = window.location.origin
    } else {
      // Server-side: use environment variable or default
      this.baseUrl =
        process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000"
    }
  }
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`
    
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }
    
    const response = await fetch(url, config)
    
    // Helper – safely parse JSON only when it’s really JSON
    const parseJson = async () => {
      const contentType = response.headers.get("content-type") ?? ""
      if (response.status === 204 || !contentType.includes("application/json")) {
        return undefined
      }
      try {
        return await response.json()
      } catch {
        // Fall back to plain text if JSON parsing fails
        return undefined
      }
    }
    
    const data = await parseJson()
    
    if (!response.ok) {
      // Prefer explicit error message from the server
      const message = (data as any)?.error /* server‐shaped error */ ?? response.statusText ?? `HTTP ${response.status}`
      throw new Error(message)
    }
    
    return data as T
  }
  
  // Auth endpoints
  async signUp(email: string, password: string, displayName?: string) {
    return this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName }),
    })
  }
  
  async signIn(email: string, password: string) {
    return this.request("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }
  
  async signOut() {
    const supabase = await createClient()
    return await supabase.auth.signOut()
    /*return this.request("/auth/signout", {
      method: "POST",
    })*/
  }
  
  async resetPassword(email: string) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }
  
  async updatePassword(newPassword: string) {
    return this.request("/auth/update-password", {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    })
  }
  
  async getProfile() {
    return this.request("/auth/profile")
  }
  
  async updateProfile(updates: { display_name?: string; avatar_url?: string }) {
    return this.request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }
  
  // References endpoints
  async getAllReferences() {
    return this.request<{ references: BibleReference[] }>("/references")
  }
  
  async createReference(reference: Partial<BibleReference>) {
    return this.request<{ reference: BibleReference }>("/references", {
      method: "POST",
      body: JSON.stringify(reference),
    })
  }
  
  async getReference(id: string) {
    return this.request<{ reference: BibleReference }>(`/references/${id}`)
  }
  
  async updateReference(id: string, updates: Partial<BibleReference>) {
    return this.request<{ success: boolean; reference: BibleReference }>(`/references/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }
  
  async deleteReference(id: string) {
    return this.request(`/references/${id}`, {
      method: "DELETE",
    })
  }
  
  async getFavoriteReferences() {
    return this.request<{ favorites: BibleReference[]; count: number }>("/references/favorites")
  }
  
  async toggleFavorite(id: string) {
    return this.request<{ reference: BibleReference }>(`/references/${id}/favorite`, {
      method: "POST",
    })
  }
  
  async getRecentReferences(limit = 10) {
    return this.request<{ references: BibleReference[] }>(`/references/recent?limit=${limit}`)
  }
  
  async getBooksWithCounts() {
    return this.request<{ books: Array<{ book: string; count: number }> }>("/references/books")
  }
  
  async getReferencesByBook(book: string) {
    return this.request<{ references: BibleReference[] }>(`/references/books/${encodeURIComponent(book)}`)
  }
  
  async getChaptersWithCounts(book: string) {
    return this.request<{ chapters: Array<{ chapter: number; count: number }> }>(
      `/references/books/${encodeURIComponent(book)}/chapters`,
    )
  }
  
  async getReferencesByChapter(book: string, chapter: number) {
    return this.request<{ references: BibleReference[] }>(
      `/references/books/${encodeURIComponent(book)}/chapters/${chapter}`,
    )
  }
  
  async saveVerseText(id: string, verseTexts: string[]) {
    return this.request<{ reference: BibleReference }>(`/references/${id}/text`, {
      method: "PUT",
      body: JSON.stringify({ verseTexts }),
    })
  }
  
  // Bible API endpoints
  async fetchVerses(reference: BibleReference) {
    return this.request<{ verses: BibleVerse[] }>("/bible/verses", {
      method: "POST",
      body: JSON.stringify(reference),
    })
  }
  
  // Health check
  async healthCheck() {
    return this.request("/health")
  }
}

export const apiClient = new ApiClient()
