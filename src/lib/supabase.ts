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
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })
  : null

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co')
}

// Real-time subscription helper
export const subscribeToGroupUpdates = (groupId: string, callback: (payload: unknown) => void) => {
  if (!supabase) return null;

  return supabase
    .channel(`group-${groupId}`)
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Group',
        filter: `id=eq.${groupId}`
      },
      callback
    )
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Member',
        filter: `group_id=eq.${groupId}`
      },
      callback
    )
    .subscribe();
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      Group: {
        Row: {
          id: string
          code: string
          created_at: string
          creator_firebase_uid: string
        }
        Insert: {
          id?: string
          code: string
          created_at?: string
          creator_firebase_uid: string
        }
        Update: {
          id?: string
          code?: string
          created_at?: string
          creator_firebase_uid?: string
        }
      },
      Member: {
        Row: {
          id: string
          groupId: string
          clerkUserId: string
          name: string
          location: string
          budget: number
          moodTags: string
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id?: string
          groupId: string
          clerkUserId: string
          name: string
          location: string
          budget: number
          moodTags: string
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          groupId?: string
          clerkUserId?: string
          name?: string
          location?: string
          budget?: number
          moodTags?: string
          is_admin?: boolean
          created_at?: string
        }
      },
      ItineraryVotes: {
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
      },
      Itinerary: {
        Row: {
          id: string
          group_id: string
          locations: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          locations: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          locations?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
