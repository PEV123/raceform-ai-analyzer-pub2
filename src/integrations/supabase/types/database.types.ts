import type { RacesTable } from './races.types';
import type { RunnersTable } from './runners.types';
import type { Json } from './json.types';

export interface Database {
  public: {
    Tables: {
      admin_settings: AdminSettingsTable
      race_chats: RaceChatsTable
      race_documents: RaceDocumentsTable
      races: RacesTable
      runners: RunnersTable
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

interface AdminSettingsTable {
  Row: {
    created_at: string
    id: string
    knowledge_base: string
    system_prompt: string
    timezone: string
    updated_at: string
  }
  Insert: {
    created_at?: string
    id?: string
    knowledge_base?: string
    system_prompt?: string
    timezone?: string
    updated_at?: string
  }
  Update: {
    created_at?: string
    id?: string
    knowledge_base?: string
    system_prompt?: string
    timezone?: string
    updated_at?: string
  }
  Relationships: []
}

interface RaceChatsTable {
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
    }
  ]
}

interface RaceDocumentsTable {
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
    }
  ]
}

export type { AdminSettingsTable, RaceChatsTable, RaceDocumentsTable };