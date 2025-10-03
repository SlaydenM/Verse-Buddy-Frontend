export interface Database {
  public: {
    Tables: {
      bible_references: {
        Row: {
          id: string
          user_id: string
          version: string
          book: string
          chapter: number
          start_verse: number
          end_verse: number
          final_verse: number
          is_favorite: boolean
          text: string[] | null
          headings: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          version: string
          book: string
          chapter: number
          start_verse: number
          end_verse: number
          final_verse: number
          is_favorite?: boolean
          text?: string[] | null
          headings?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          version?: string
          book?: string
          chapter?: number
          start_verse?: number
          end_verse?: number
          final_verse?: number
          is_favorite?: boolean
          text?: string[] | null
          headings?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type BibleReference = Database["public"]["Tables"]["bible_references"]["Row"]
export type BibleReferenceInsert = Database["public"]["Tables"]["bible_references"]["Insert"]
export type BibleReferenceUpdate = Database["public"]["Tables"]["bible_references"]["Update"]
