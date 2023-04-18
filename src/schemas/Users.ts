export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  users_data: {
    Tables: {
      user_data: {
        Row: {
          current_quiz_rank: number | null
          current_quiz_score: number | null
          current_score: number
          date_completed: string | null
          isAdmin: boolean
          nft_earned: number
          nonce: string | null
          overall_score: number
          public_address: string
          questions_answered: number
          questions_correct: number
          user_id: string
          user_name: string
          winner: boolean | null
        }
        Insert: {
          current_quiz_rank?: number | null
          current_quiz_score?: number | null
          current_score?: number
          date_completed?: string | null
          isAdmin?: boolean
          nft_earned?: number
          nonce?: string | null
          overall_score?: number
          public_address: string
          questions_answered?: number
          questions_correct?: number
          user_id?: string
          user_name: string
          winner?: boolean | null
        }
        Update: {
          current_quiz_rank?: number | null
          current_quiz_score?: number | null
          current_score?: number
          date_completed?: string | null
          isAdmin?: boolean
          nft_earned?: number
          nonce?: string | null
          overall_score?: number
          public_address?: string
          questions_answered?: number
          questions_correct?: number
          user_id?: string
          user_name?: string
          winner?: boolean | null
        }
      }
    }
    Views: {
      ranking_user_data: {
        Row: {
          current_quiz_rank: number | null
          current_quiz_score: number | null
          current_score: number | null
          date_completed: string | null
          isAdmin: boolean | null
          nft_earned: number | null
          nonce: string | null
          overall_rank: number | null
          overall_score: number | null
          public_address: string | null
          questions_answered: number | null
          questions_correct: number | null
          user_id: string | null
          user_name: string | null
          winner: boolean | null
        }
      }
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
