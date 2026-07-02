/**
 * Dreamthread Database Types
 *
 * This file contains TypeScript definitions for the Supabase database schema.
 * It is manually maintained for now (matches the SQL in supabase/migrations/).
 *
 * Recommended: After running the migration in Supabase, you can replace/refresh
 * this file using the Supabase CLI:
 *
 *   npx supabase gen types typescript --project-id <your-project-ref> > types/database.ts
 *
 * Then commit the generated version.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      dreams: {
        Row: {
          id: string
          user_id: string
          title: string | null
          content: string
          dream_date: string
          mood: string | null
          is_lucid: boolean
          image_url: string | null
          image_generation_count: number
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          content: string
          dream_date?: string
          mood?: string | null
          is_lucid?: boolean
          image_url?: string | null
          image_generation_count?: number
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          content?: string
          dream_date?: string
          mood?: string | null
          is_lucid?: boolean
          image_url?: string | null
          image_generation_count?: number
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'dreams_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// -----------------------------------------------------------------------------
// Convenience aliases for the dreams table
// -----------------------------------------------------------------------------

export type Dream = Database['public']['Tables']['dreams']['Row']
export type DreamInsert = Database['public']['Tables']['dreams']['Insert']
export type DreamUpdate = Database['public']['Tables']['dreams']['Update']

// Example usage with typed Supabase client:
// import type { Database } from '@/types/database'
// const supabase = createClient<Database>(url, key)
