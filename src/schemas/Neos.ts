export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  nft: {
    Tables: {
      neo_data: {
        Row: {
          dateUTC: number
          id: string
          name: string
          range_miles: number
          size_feet: number
          velocity_mph: number
        }
        Insert: {
          dateUTC: number
          id: string
          name: string
          range_miles: number
          size_feet: number
          velocity_mph: number
        }
        Update: {
          dateUTC?: number
          id?: string
          name?: string
          range_miles?: number
          size_feet?: number
          velocity_mph?: number
        }
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
