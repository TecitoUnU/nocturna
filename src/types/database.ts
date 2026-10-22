/**
 * Tipos de la base de datos Supabase (PostgreSQL).
 *
 * Reflejan exactamente el esquema definido en
 * `supabase/migrations/0001_esquema_y_politicas.sql`.
 * Si cambias una columna, actualiza también este archivo.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type EstadoVideo = "draft" | "published";

/**
 * Nota: se usan `type` (no `interface`) para que estas formas sean
 * asignables a `Record<string, unknown>`, que es lo que espera el cliente de
 * Supabase.
 */
export type FilaVideo = {
  id: string;
  youtube_video_id: string;
  title: string;
  slug: string;
  title_search: string;
  description: string;
  thumbnail_url: string | null;
  thumbnail_path: string | null;
  category: string | null;
  tags: string[];
  status: EstadoVideo;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type FilaCategoria = {
  id: string;
  slug: string;
  name: string;
  created_at: string;
};

export type FilaAdmin = {
  id: string;
  email: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      videos: {
        Row: FilaVideo;
        Insert: {
          id?: string;
          youtube_video_id: string;
          title: string;
          slug: string;
          title_search?: string;
          description?: string;
          thumbnail_url?: string | null;
          thumbnail_path?: string | null;
          category?: string | null;
          tags?: string[];
          status?: EstadoVideo;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          youtube_video_id?: string;
          title?: string;
          slug?: string;
          title_search?: string;
          description?: string;
          thumbnail_url?: string | null;
          thumbnail_path?: string | null;
          category?: string | null;
          tags?: string[];
          status?: EstadoVideo;
          is_featured?: boolean;
          updated_at?: string;
          published_at?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: FilaCategoria;
        Insert: { id?: string; slug: string; name: string; created_at?: string };
        Update: { slug?: string; name?: string };
        Relationships: [];
      };
      admins: {
        Row: FilaAdmin;
        Insert: { id?: string; email: string; created_at?: string };
        Update: { email?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: {
      video_status: EstadoVideo;
    };
    CompositeTypes: Record<string, never>;
  };
};
