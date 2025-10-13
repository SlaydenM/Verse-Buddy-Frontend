// Simple fetch-based API client that proxies to server routes (Next.js app router)
const BASE = '/api'

export const apiClient = {
  // -----AUTH METHODS----------------------------
  async signIn(email: string, password: string) {
    const res = await fetch(`${BASE}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })
    return await res.json()
  },
  
  async signUp(email: string, password: string) {
    const res = await fetch(`${BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })
    return await res.json()
  },
  
  async signOut() {
    const res = await fetch(`${BASE}/auth/signout`, {
      method: 'POST',
      credentials: 'include',
    })
    return await res.json()
  },
  
  async getCurrentUser() {
    const res = await fetch(`${BASE}/auth/me`, { credentials: 'include' })
    return await res.json()
  },
  
  // -----DATABASE METHODS----------------------------
  // Many
  async getFavoriteReferences() {
    const res = await fetch(`${BASE}/references/favorites`, { credentials: 'include' })
    return await res.json()
  },
  
  async getRecentReferences() {
    const res = await fetch(`${BASE}/references/recent`, { credentials: 'include' })
    return await res.json()
  },
  
  async getAllReferences() {
    const res = await fetch(`${BASE}/references`, { credentials: 'include' })
    return await res.json()
  },
  
  async getReferencesByBook(book: string) {
    const res = await fetch(`${BASE}/references/books/${encodeURIComponent(book)}`, { credentials: 'include' })
    return await res.json()
  },
  
  async getReferencesByChapter(book: string, chapter: number) {
    const res = await fetch(`${BASE}/references/books/${encodeURIComponent(book)}/chapters/${chapter}`, { credentials: 'include' })
    return await res.json()
  },
  
  async getChaptersWithCounts(book: string) {
    const res = await fetch(`${BASE}/references/books/${encodeURIComponent(book)}/chapters`, { credentials: 'include' })
    return await res.json()
    // { chapters: Array<{ chapter: number; count: number }> }
  },
  
  // Single
  async createReference(reference: any) {
    const res = await fetch(`${BASE}/references`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reference),
      credentials: 'include',
    })
    return await res.json()
  },
  
  async getReference(id: string) {
    const res = await fetch(`${BASE}/references/${id}`, { credentials: 'include' })
    return await res.json()
  },
  
  async updateReference(id: string, payload: any) {
    const res = await fetch(`${BASE}/references/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    })
    return await res.json()
  },

  async deleteReference(id: string) {
    const res = await fetch(`${BASE}/references/${id}`, { method: 'DELETE', credentials: 'include' })
    return await res.json()
  },
  
  async favoriteAll(ids: string[]) {
    await fetch(`${BASE}/references/favorites/favorite`, { 
      method: 'POST', 
      body: JSON.stringify({ ids }),
      credentials: 'include' 
    })
    // return await res.json()
  },
  
  async unfavoriteAll(ids: string[]) {
    await fetch(`${BASE}/references/favorites/unfavorite`, { 
      method: 'POST', 
      body: JSON.stringify({ ids }),
      credentials: 'include' 
    })
    // return await res.json()
  },

  async healthCheck() {
    const res = await fetch(`${BASE}/health`)
    return await res.json()
  },
}

export default apiClient
