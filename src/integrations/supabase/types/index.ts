import type { Database as GeneratedDatabase } from './database.types';
import type { RacesTable } from './races.types';
import type { RunnersTable } from './runners.types';
import type { Json } from './json.types';

export type Database = GeneratedDatabase;
export type { RacesTable, RunnersTable, Json };

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];