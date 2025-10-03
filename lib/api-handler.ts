import { createClient } from '@/utils/supabase/server'
import type { BibleReference } from "@/types/bible"
import type { BibleReference as DbBibleReference, BibleReferenceInsert } from "@/types/database"

// Convert database row to BibleReference
function dbRowToBibleReference(row: DbBibleReference): BibleReference {
  return {
    id: row.id,
    version: row.version,
    book: row.book,
    chapter: row.chapter,
    startVerse: row.start_verse,
    endVerse: row.end_verse,
    finalVerse: row.final_verse,
    isFavorite: row.is_favorite,
    text: row.text || [],
    headings: row.headings || {5:"p"},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Convert BibleReference to database insert
function bibleReferenceToDbInsert(ref: BibleReference, user_id: string): BibleReferenceInsert {
  const insert: any = {
    user_id,
    version: ref.version,
    book: ref.book,
    chapter: ref.chapter,
    start_verse: ref.startVerse,
    end_verse: ref.endVerse,
    is_favorite: ref.isFavorite || false,
    text: ref.text || null,
    headings: ref.headings || null,
  }
  if (ref.finalVerse !== undefined) {
    insert.final_verse = ref.finalVerse
  }
  return insert
}

export class Handler {
  // ==================== AUTH METHODS ====================
  
  // Sign up with email and password
  static async signUp(email: string, password: string, displayName?: string) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
      data: {
        display_name: displayName || email.split("@")[0],
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_DOMAIN_NAME}/auth/callback`, // Redirect after email confirmation
      },
    })
    
    if (error) {
      console.error("Error signing up:", error)
      throw new Error(error.message)
    }
    
    // Check if the user was immediately confirmed (email confirmations disabled)
    if (data.user && data.session) {
      console.log("✅ User automatically signed in after signup")
      return { data, autoSignedIn: true }
    }
    
    // Check if user exists but needs email confirmation
    if (data.user && !data.session) {
      console.log("📧 Email confirmation required")
      return { data, autoSignedIn: false }
    }
    
    return { data, autoSignedIn: false }
  }
  
  // Sign in with email and password`
  static async signIn(email: string, password: string) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error("Error signing in:", error)
      
      // Provide more helpful error messages
      if (error.message.includes("Email not confirmed")) {
        throw new Error("Please check your email and click the confirmation link before signing in.")
      }
      
      throw new Error(`${error.message}`)
    }
    
    return data
  }
  
  // Sign out
  static async signOut() {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error("Error signing out:", error)
      throw new Error(error.message)
    }
  }

  // Get current user
  static async getCurrentUser(supabase?: any) {
    if (!supabase)
      supabase = await createClient()
    
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    
    if (error) {
      console.error("Error getting current user:", error)
      return null
    }
    
    return user
  }

  // Get current session
  static async getCurrentSession() {
    const supabase = await createClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    
    if (error) {
      console.error("Error getting current session:", error)
      return null
    }

    return session
  }
  
  // Reset password
  static async resetPassword(email: string) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_DOMAIN_NAME}/auth/reset-password`,
    })

    if (error) {
      console.error("Error resetting password:", error)
      throw new Error(error.message)
    }
  }
  
  // Update password
  static async updatePassword(newPassword: string) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error("Error updating password:", error)
      throw new Error(error.message)
    }
  }
  
  // Update user profile
  static async updateProfile(updates: { display_name?: string; avatar_url?: string }) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.updateUser({
      data: updates,
    })

    if (error) {
      console.error("Error updating profile:", error)
      throw new Error(error.message)
    }
  }
  
  // ==================== BIBLE REFERENCE METHODS ====================
  
  // Get current user ID (helper method)
  private static async getCurrentUserId(supabase?: any): Promise<string | null> {
    const user = await this.getCurrentUser(supabase)
    return user ? user.id : null
  }
  
  // Get all references for current user
  static async getAllReferences(): Promise<BibleReference[]> {
    const supabase = await createClient()
    const userId = await this.getCurrentUserId(supabase)
    if (!userId) return []
    
    const { data, error } = await supabase
      .from("bible_references")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    
    if (error) {
      console.error("Error fetching bible references:", error)
      throw new Error("Failed to fetch bible references")
    }
    
    return data.map(dbRowToBibleReference)
  }
  
  // Get references by book for current user
  static async getReferencesByBook(book: string): Promise<BibleReference[]> {
    const supabase = await createClient()
    const userId = await this.getCurrentUserId(supabase)
    if (!userId) return []
    
    const { data, error } = await supabase
      .from("bible_references")
      .select("*")
      .eq("user_id", userId)
      .eq("book", book)
      .order("chapter", { ascending: true })
      .order("start_verse", { ascending: true })
    
    if (error) {
      console.error("Error fetching references by book:", error)
      throw new Error("Failed to fetch references")
    }
    
    return data.map(dbRowToBibleReference)
  }
  
  // Get references by book and chapter for current user
  static async getReferencesByChapter(book: string, chapter: number): Promise<BibleReference[]> {
    const supabase = await createClient()
    const userId = await this.getCurrentUserId(supabase)
    if (!userId) return []
    
    const { data, error } = await supabase
      .from("bible_references")
      .select("*")
      .eq("user_id", userId)
      .eq("book", book)
      .eq("chapter", chapter)
      .order("start_verse", { ascending: true })
    
    if (error) {
      console.error("Error fetching references by chapter:", error)
      throw new Error("Failed to fetch references")
    }
    
    return data.map(dbRowToBibleReference)
  }

  // Get favorite references for current user
  static async getFavoriteReferences(): Promise<BibleReference[]> {
    const supabase = await createClient()
    const userId = await this.getCurrentUserId(supabase)
    if (!userId) return []
    
    const { data, error } = await supabase
      .from("bible_references")
      .select("*")
      .eq("user_id", userId)
      .eq("is_favorite", true)
      .order("updated_at", { ascending: false })
    
    if (error) {
      console.error("Error fetching favorite references:", error)
      throw new Error("Failed to fetch favorite references")
    }
    
    return data.map(dbRowToBibleReference)
  }
  
  // Add a new reference for current user
  static async addReference(reference: BibleReference): Promise<BibleReference> {
    const supabase = await createClient()
    const userId = await this.getCurrentUserId(supabase)
    if (!userId) {
      throw new Error("User not authenticated")
    }
    
    // Check if reference already exists for this user
    const existing = await this.findExistingReference(reference)
    if (existing) {
      return existing
    }
    
    const { data, error } = await supabase
      .from("bible_references")
      .insert(bibleReferenceToDbInsert(reference, userId))
      .select()
      .single()
    
    if (error) {
      console.error("Error adding bible reference:", error)
      throw new Error("Failed to add bible reference")
    }
    
    return dbRowToBibleReference(data)
  }
  
  // Find existing reference for current user (to avoid duplicates)
  static async findExistingReference(reference: BibleReference): Promise<BibleReference | null> {
    const supabase = await createClient()
    const userId = await this.getCurrentUserId(supabase)
    if (!userId) {
      return null
    }
    
    const { data, error } = await supabase
      .from("bible_references")
      .select("*")
      .eq("user_id", userId)
      .eq("version", reference.version)
      .eq("book", reference.book)
      .eq("chapter", reference.chapter)
      .eq("start_verse", reference.startVerse)
      .eq("end_verse", reference.endVerse)
      .single()
    
    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      console.error("Error finding existing reference:", error)
      return null
    }
    
    return data ? dbRowToBibleReference(data) : null
  }
  
  // Update reference for current user
  static async updateReference(id: string, updates: Partial<BibleReference>): Promise<BibleReference> {
    const supabase = await createClient()
    const userId = await this.getCurrentUserId(supabase)
    if (!userId) {
      throw new Error("User not authenticated")
    }
    
    const dbUpdates: any = {}
    if (updates.version !== undefined) dbUpdates.version = updates.version
    if (updates.book !== undefined) dbUpdates.book = updates.book
    if (updates.chapter !== undefined) dbUpdates.chapter = updates.chapter
    if (updates.startVerse !== undefined) dbUpdates.start_verse = updates.startVerse
    if (updates.endVerse !== undefined) dbUpdates.end_verse = updates.endVerse
    if (updates.finalVerse !== undefined) dbUpdates.final_verse = updates.finalVerse
    if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite
    if (updates.text !== undefined) dbUpdates.text = updates.text
    
    const { data, error } = await supabase
      .from("bible_references")
      .update(dbUpdates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()
    
    if (error) {
      console.error("Error updating bible reference:", error)
      throw new Error("Failed to update bible reference")
    }
    
    return dbRowToBibleReference(data)
  }
  
  // Toggle favorite status for a reference
  static async toggleFavorite(id: string): Promise<BibleReference> {
    const supabase = await createClient()
    const userId = await this.getCurrentUserId(supabase)
    if (!userId) {
      throw new Error("User not authenticated")
    }
    
    // First get the current favorite status
    const { data: currentData, error: fetchError } = await supabase
      .from("bible_references")
      .select("is_favorite")
      .eq("id", id)
      .eq("user_id", userId)
      .single()
    
    if (fetchError) {
      console.error("Error fetching current favorite status:", fetchError)
      throw new Error("Failed to fetch current favorite status")
    }
    
    // Toggle the favorite status
    const newFavoriteStatus = !currentData.is_favorite
    
    const { data, error } = await supabase
      .from("bible_references")
      .update({ is_favorite: newFavoriteStatus })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()
    
    if (error) {
      console.error("Error toggling favorite status:", error)
      throw new Error("Failed to toggle favorite status")
    }
    
    return dbRowToBibleReference(data)
  }
  
  // Delete a reference for current user
  static async deleteReference(id: string): Promise<void> {
    const supabase = await createClient()
    const userId = await this.getCurrentUserId(supabase)
    if (!userId) {
      throw new Error("User not authenticated")
    }
    
    const { error } = await supabase.from("bible_references").delete().eq("id", id).eq("user_id", userId)
    
    if (error) {
      console.error("Error deleting bible reference:", error)
      throw new Error("Failed to delete bible reference")
    }
  }
  
  // Get recent references for current user (last 10)
  static async getRecentReferences(): Promise<BibleReference[]> {
    const supabase = await createClient()
    const userId = await this.getCurrentUserId(supabase)
    if (!userId) return []
    
    const { data, error } = await supabase
      .from("bible_references")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(10)
    
    if (error) {
      console.error("Error fetching recent references:", error)
      throw new Error("Failed to fetch recent references")
    }
    
    return data.map(dbRowToBibleReference)
  }
  
  // Get unique books that have references for current user
  static async getBooksWithReferences(): Promise<string[]> {
    const supabase = await createClient()
    const userId = await this.getCurrentUserId(supabase)
    if (!userId) return []
    
    const { data, error } = await supabase.from("bible_references").select("book").eq("user_id", userId).order("book")
    
    if (error) {
      console.error("Error fetching books with references:", error)
      throw new Error("Failed to fetch books")
    }
    
    // Get unique books
    const uniqueBooks = [...new Set(data.map((row) => row.book))]
    return uniqueBooks
  }
  
  // Get unique books that have references with counts for current user
  static async getBooksWithReferenceCounts(): Promise<Array<{ book: string; count: number }>> {
    const supabase = await createClient()
    const userId = await this.getCurrentUserId(supabase)
    if (!userId) return []
    
    const { data, error } = await supabase.from("bible_references").select("book").eq("user_id", userId).order("book")
    
    if (error) {
      console.error("Error fetching books with reference counts:", error)
      throw new Error("Failed to fetch books")
    }
    
    // Count references per book
    const bookCounts = data.reduce(
      (acc, row) => {
        acc[row.book] = (acc[row.book] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    
    return Object.entries(bookCounts).map(([book, count]) => ({ book, count }))
  }
  
  // Get unique chapters for a book that have references for current user
  static async getChaptersWithReferences(book: string): Promise<number[]> {
    const supabase = await createClient()
    const userId = await this.getCurrentUserId(supabase)
    if (!userId) return []
    
    const { data, error } = await supabase
      .from("bible_references")
      .select("chapter")
      .eq("user_id", userId)
      .eq("book", book)
      .order("chapter")
    
    if (error) {
      console.error("Error fetching chapters with references:", error)
      throw new Error("Failed to fetch chapters")
    }
    
    // Get unique chapters
    const uniqueChapters = [...new Set(data.map((row) => row.chapter))].sort((a, b) => a - b)
    return uniqueChapters
  }
  
  // Get unique chapters for a book that have references with counts for current user
  static async getChaptersWithReferenceCounts(book: string): Promise<Array<{ chapter: number; count: number }>> {
    const supabase = await createClient()
    const userId = await this.getCurrentUserId(supabase)
    if (!userId) return []
    
    const { data, error } = await supabase
      .from("bible_references")
      .select("chapter")
      .eq("user_id", userId)
      .eq("book", book)
      .order("chapter")
    
    if (error) {
      console.error("Error fetching chapters with reference counts:", error)
      throw new Error("Failed to fetch chapters")
    }
    
    // Count references per chapter
    const chapterCounts = data.reduce(
      (acc, row) => {
        acc[row.chapter] = (acc[row.chapter] || 0) + 1
        return acc
      },
      {} as Record<number, number>,
    )
    
    return Object.entries(chapterCounts)
      .map(([chapter, count]) => ({
        chapter: Number.parseInt(chapter),
        count,
      }))
      .sort((a, b) => a.chapter - b.chapter)
  }
  
  // Save verse text for a reference
  static async saveVerseText(id: string, verseTexts: string[]): Promise<BibleReference> {
    const supabase = await createClient()
    const userId = await this.getCurrentUserId(supabase)
    if (!userId) {
      throw new Error("User not authenticated")
    }
    
    const { data, error } = await supabase
      .from("bible_references")
      .update({ text: verseTexts })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()
    
    if (error) {
      console.error("Error saving verse text:", error)
      throw new Error("Failed to save verse text")
    }
    
    return dbRowToBibleReference(data)
  }
}
