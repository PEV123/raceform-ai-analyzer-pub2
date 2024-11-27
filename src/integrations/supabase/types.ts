export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      race_chats: {
        Row: {
          created_at: string
          id: string
          message: string
          race_id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          race_id: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          race_id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_race"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_chats_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      race_documents: {
        Row: {
          content_type: string
          created_at: string | null
          file_name: string
          file_path: string
          id: string
          race_id: string
        }
        Insert: {
          content_type: string
          created_at?: string | null
          file_name: string
          file_path: string
          id?: string
          race_id: string
        }
        Update: {
          content_type?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          id?: string
          race_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_documents_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      races: {
        Row: {
          age_band: string
          course: string
          created_at: string | null
          field_size: number
          id: string
          off_time: string
          prize: string
          race_class: string
          race_name: string
          rating_band: string
          region: string
        }
        Insert: {
          age_band: string
          course: string
          created_at?: string | null
          field_size: number
          id?: string
          off_time: string
          prize: string
          race_class: string
          race_name: string
          rating_band: string
          region: string
        }
        Update: {
          age_band?: string
          course?: string
          created_at?: string | null
          field_size?: number
          id?: string
          off_time?: string
          prize?: string
          race_class?: string
          race_name?: string
          rating_band?: string
          region?: string
        }
        Relationships: []
      }
      runners: {
        Row: {
          created_at: string | null
          dam: string
          dam_region: string
          draw: number
          form: string | null
          headgear: string | null
          horse: string
          horse_id: string
          id: string
          jockey: string
          lbs: number
          number: number
          ofr: string | null
          race_id: string | null
          silk_url: string | null
          sire: string
          sire_region: string
          trainer: string
          ts: string | null
        }
        Insert: {
          created_at?: string | null
          dam: string
          dam_region: string
          draw: number
          form?: string | null
          headgear?: string | null
          horse: string
          horse_id: string
          id?: string
          jockey: string
          lbs: number
          number: number
          ofr?: string | null
          race_id?: string | null
          silk_url?: string | null
          sire: string
          sire_region: string
          trainer: string
          ts?: string | null
        }
        Update: {
          created_at?: string | null
          dam?: string
          dam_region?: string
          draw?: number
          form?: string | null
          headgear?: string | null
          horse?: string
          horse_id?: string
          id?: string
          jockey?: string
          lbs?: number
          number?: number
          ofr?: string | null
          race_id?: string | null
          silk_url?: string | null
          sire?: string
          sire_region?: string
          trainer?: string
          ts?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "runners_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
