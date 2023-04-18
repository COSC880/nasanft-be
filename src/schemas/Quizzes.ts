export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  quiz_information: {
    Tables: {
      quiz_answers: {
        Row: {
          answer: string
          answer_id: string
          correct_answer: boolean
          question_id: string
          quiz_id: string
        }
        Insert: {
          answer: string
          answer_id?: string
          correct_answer?: boolean
          question_id: string
          quiz_id: string
        }
        Update: {
          answer?: string
          answer_id?: string
          correct_answer?: boolean
          question_id?: string
          quiz_id?: string
        }
      }
      quiz_questions: {
        Row: {
          correct_answer_id: string | null
          difficulty: number | null
          question: string
          question_id: string
          quiz_id: string
        }
        Insert: {
          correct_answer_id?: string | null
          difficulty?: number | null
          question: string
          question_id?: string
          quiz_id: string
        }
        Update: {
          correct_answer_id?: string | null
          difficulty?: number | null
          question?: string
          question_id?: string
          quiz_id?: string
        }
      }
      quizzes: {
        Row: {
          quiz_id: string
        }
        Insert: {
          quiz_id: string
        }
        Update: {
          quiz_id?: string
        }
      }
      winners: {
        Row: {
          neo_id: string
          public_address: string
        }
        Insert: {
          neo_id: string
          public_address: string
        }
        Update: {
          neo_id?: string
          public_address?: string
        }
      }
    }
    Views: {
      random_quizzes: {
        Row: {
          quiz_id: string | null
        }
        Insert: {
          quiz_id?: string | null
        }
        Update: {
          quiz_id?: string | null
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
