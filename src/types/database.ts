export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          date_of_birth: string | null;
          numerology_report: Json | null;
          tuvi_report: Json | null;
          chiem_tinh_report: Json | null;
          gioi_tinh: "nam" | "nu";
          gio_sinh: number;
          noi_sinh: string;
          vi_do: number;
          kinh_do: number;
          onboarding_completed: boolean;
          ref_code: string | null;
          referred_by: string | null;
          telegram_chat_id: string | null;
          public_slug: string | null;
          public_bio: string | null;
          public_avatar_url: string | null;
          public_headline: string | null;
          public_website: string | null;
          public_social_links: Json | null;
          public_skills: string[] | null;
          public_is_visible: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string;
          date_of_birth?: string | null;
          numerology_report?: Json | null;
          tuvi_report?: Json | null;
          chiem_tinh_report?: Json | null;
          gioi_tinh?: "nam" | "nu";
          gio_sinh?: number;
          noi_sinh?: string;
          vi_do?: number;
          kinh_do?: number;
          onboarding_completed?: boolean;
          ref_code?: string | null;
          referred_by?: string | null;
          telegram_chat_id?: string | null;
          public_slug?: string | null;
          public_bio?: string | null;
          public_avatar_url?: string | null;
          public_headline?: string | null;
          public_website?: string | null;
          public_social_links?: Json | null;
          public_skills?: string[] | null;
          public_is_visible?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          date_of_birth?: string | null;
          numerology_report?: Json | null;
          tuvi_report?: Json | null;
          chiem_tinh_report?: Json | null;
          gioi_tinh?: "nam" | "nu";
          gio_sinh?: number;
          noi_sinh?: string;
          vi_do?: number;
          kinh_do?: number;
          onboarding_completed?: boolean;
          ref_code?: string | null;
          referred_by?: string | null;
          telegram_chat_id?: string | null;
          public_slug?: string | null;
          public_bio?: string | null;
          public_avatar_url?: string | null;
          public_headline?: string | null;
          public_website?: string | null;
          public_social_links?: Json | null;
          public_skills?: string[] | null;
          public_is_visible?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: "draft" | "in_progress" | "completed" | "archived";
          thumbnail_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: "draft" | "in_progress" | "completed" | "archived";
          thumbnail_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: "draft" | "in_progress" | "completed" | "archived";
          thumbnail_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      videos: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          url: string | null;
          thumbnail_url: string | null;
          duration: number;
          status: "processing" | "ready" | "failed" | "published";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          title: string;
          description?: string | null;
          url?: string | null;
          thumbnail_url?: string | null;
          duration?: number;
          status?: "processing" | "ready" | "failed" | "published";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          title?: string;
          description?: string | null;
          url?: string | null;
          thumbnail_url?: string | null;
          duration?: number;
          status?: "processing" | "ready" | "failed" | "published";
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          content: string | null;
          file_url: string | null;
          file_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          title: string;
          content?: string | null;
          file_url?: string | null;
          file_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          title?: string;
          content?: string | null;
          file_url?: string | null;
          file_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
