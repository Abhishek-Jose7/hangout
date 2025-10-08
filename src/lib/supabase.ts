import { createClient } from '@supabase/supabase-js'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create Supabase client only if valid keys are provided
export const supabase = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co'
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co')
}

// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          created_at?: string
          updated_at?: string
        }
      }
      members: {
        Row: {
          id: string
          name: string
          location: string
          budget: number
          mood_tags: string
          clerk_user_id: string | null
          email: string | null
          group_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          budget: number
          mood_tags: string
          clerk_user_id?: string | null
          email?: string | null
          group_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          budget?: number
          mood_tags?: string
          clerk_user_id?: string | null
          email?: string | null
          group_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      itinerary_votes: {
        Row: {
          id: string
          group_id: string
          member_id: string
          itinerary_idx: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          member_id: string
          itinerary_idx: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          member_id?: string
          itinerary_idx?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
