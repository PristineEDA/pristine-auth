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
      desktop_exchange_codes: {
        Row: {
          code_hash: string
          consumed_at: string | null
          created_at: string
          encrypted_payload: string
          expires_at: string
          id: string
          redirect_uri: string
          user_id: string
        }
        Insert: {
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          encrypted_payload: string
          expires_at: string
          id?: string
          redirect_uri: string
          user_id: string
        }
        Update: {
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          encrypted_payload?: string
          expires_at?: string
          id?: string
          redirect_uri?: string
          user_id?: string
        }
        Relationships: []
      }
      user_config_snapshots: {
        Row: {
          created_at: string
          settings: Json
          sync_version: number
          synced_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          settings?: Json
          sync_version?: number
          synced_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          settings?: Json
          sync_version?: number
          synced_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          email: string
          updated_at: string
          user_id: string
          username: string
          username_normalized: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          email: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          email?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}