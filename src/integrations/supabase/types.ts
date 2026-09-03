export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academy_assessment_attempts: {
        Row: {
          answers: Json
          course_slug: string
          created_at: string
          id: string
          module_index: number
          passed: boolean
          path_slug: string
          question_ids: Json
          score: number
          total: number
          user_id: string
        }
        Insert: {
          answers?: Json
          course_slug: string
          created_at?: string
          id?: string
          module_index: number
          passed?: boolean
          path_slug: string
          question_ids?: Json
          score?: number
          total?: number
          user_id: string
        }
        Update: {
          answers?: Json
          course_slug?: string
          created_at?: string
          id?: string
          module_index?: number
          passed?: boolean
          path_slug?: string
          question_ids?: Json
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      academy_bookmarks: {
        Row: {
          course_slug: string
          created_at: string
          id: string
          lesson_id: string
          lesson_title: string
          note: string | null
          user_id: string
        }
        Insert: {
          course_slug: string
          created_at?: string
          id?: string
          lesson_id: string
          lesson_title?: string
          note?: string | null
          user_id: string
        }
        Update: {
          course_slug?: string
          created_at?: string
          id?: string
          lesson_id?: string
          lesson_title?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      academy_lessons: {
        Row: {
          content: string
          course_slug: string
          created_at: string
          glossary: Json
          key_takeaways: Json
          knowledge_check: Json
          lesson_id: string
          narration: string | null
          narration_audio_base64: string | null
          objectives: Json
          path_slug: string
          title: string
          tools: Json
          updated_at: string
        }
        Insert: {
          content: string
          course_slug: string
          created_at?: string
          glossary?: Json
          key_takeaways?: Json
          knowledge_check?: Json
          lesson_id: string
          narration?: string | null
          narration_audio_base64?: string | null
          objectives?: Json
          path_slug: string
          title: string
          tools?: Json
          updated_at?: string
        }
        Update: {
          content?: string
          course_slug?: string
          created_at?: string
          glossary?: Json
          key_takeaways?: Json
          knowledge_check?: Json
          lesson_id?: string
          narration?: string | null
          narration_audio_base64?: string | null
          objectives?: Json
          path_slug?: string
          title?: string
          tools?: Json
          updated_at?: string
        }
        Relationships: []
      }
      academy_module_assessments: {
        Row: {
          course_slug: string
          created_at: string
          id: string
          module_index: number
          module_title: string
          pass_percent: number
          path_slug: string
          question_count: number
          questions: Json
          updated_at: string
        }
        Insert: {
          course_slug: string
          created_at?: string
          id?: string
          module_index: number
          module_title: string
          pass_percent?: number
          path_slug: string
          question_count?: number
          questions?: Json
          updated_at?: string
        }
        Update: {
          course_slug?: string
          created_at?: string
          id?: string
          module_index?: number
          module_title?: string
          pass_percent?: number
          path_slug?: string
          question_count?: number
          questions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      academy_module_progress: {
        Row: {
          assessment_passed: boolean
          assessment_score: number | null
          course_slug: string
          created_at: string
          id: string
          last_lesson_id: string | null
          lesson_count: number
          lessons_completed: number
          module_index: number
          path_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_passed?: boolean
          assessment_score?: number | null
          course_slug: string
          created_at?: string
          id?: string
          last_lesson_id?: string | null
          lesson_count?: number
          lessons_completed?: number
          module_index: number
          path_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_passed?: boolean
          assessment_score?: number | null
          course_slug?: string
          created_at?: string
          id?: string
          last_lesson_id?: string | null
          lesson_count?: number
          lessons_completed?: number
          module_index?: number
          path_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      academy_profiles: {
        Row: {
          active_path_slug: string | null
          career_interest: string | null
          created_at: string
          experience_level: string
          learning_goal: string | null
          onboarded_at: string | null
          path_completed: boolean
          recommended_path: string | null
          updated_at: string
          user_id: string
          weekly_hours: number
        }
        Insert: {
          active_path_slug?: string | null
          career_interest?: string | null
          created_at?: string
          experience_level?: string
          learning_goal?: string | null
          onboarded_at?: string | null
          path_completed?: boolean
          recommended_path?: string | null
          updated_at?: string
          user_id: string
          weekly_hours?: number
        }
        Update: {
          active_path_slug?: string | null
          career_interest?: string | null
          created_at?: string
          experience_level?: string
          learning_goal?: string | null
          onboarded_at?: string | null
          path_completed?: boolean
          recommended_path?: string | null
          updated_at?: string
          user_id?: string
          weekly_hours?: number
        }
        Relationships: []
      }
      academy_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_slug: string
          created_at: string
          id: string
          lesson_id: string
          lesson_title: string
          listened_seconds: number
          path_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_slug: string
          created_at?: string
          id?: string
          lesson_id: string
          lesson_title?: string
          listened_seconds?: number
          path_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_slug?: string
          created_at?: string
          id?: string
          lesson_id?: string
          lesson_title?: string
          listened_seconds?: number
          path_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      academy_quiz_results: {
        Row: {
          course_slug: string
          created_at: string
          id: string
          kind: string
          lesson_id: string
          score: number
          total: number
          user_id: string
          weak_topics: Json
        }
        Insert: {
          course_slug: string
          created_at?: string
          id?: string
          kind?: string
          lesson_id: string
          score?: number
          total?: number
          user_id: string
          weak_topics?: Json
        }
        Update: {
          course_slug?: string
          created_at?: string
          id?: string
          kind?: string
          lesson_id?: string
          score?: number
          total?: number
          user_id?: string
          weak_topics?: Json
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      ai_chats: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      phishing_analyses: {
        Row: {
          created_at: string
          details: Json
          explanation: string | null
          id: string
          recommended_action: string | null
          risk_score: number
          url: string
          user_id: string
          verdict: string
        }
        Insert: {
          created_at?: string
          details?: Json
          explanation?: string | null
          id?: string
          recommended_action?: string | null
          risk_score?: number
          url: string
          user_id: string
          verdict: string
        }
        Update: {
          created_at?: string
          details?: Json
          explanation?: string | null
          id?: string
          recommended_action?: string | null
          risk_score?: number
          url?: string
          user_id?: string
          verdict?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          last_login: string | null
          phone: string | null
          profile_picture: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_login?: string | null
          phone?: string | null
          profile_picture?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_login?: string | null
          phone?: string | null
          profile_picture?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          search_category: string | null
          search_query: string
          search_results_count: number
          searched_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          search_category?: string | null
          search_query: string
          search_results_count?: number
          searched_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          search_category?: string | null
          search_query?: string
          search_results_count?: number
          searched_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_reports: {
        Row: {
          content: string
          created_at: string
          id: string
          risk_rating: string | null
          summary: string | null
          title: string
          url: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          risk_rating?: string | null
          summary?: string | null
          title?: string
          url: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          risk_rating?: string | null
          summary?: string | null
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vault_credentials: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          password: string
          site_name: string
          site_url: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          password: string
          site_name: string
          site_url?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          password?: string
          site_name?: string
          site_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
