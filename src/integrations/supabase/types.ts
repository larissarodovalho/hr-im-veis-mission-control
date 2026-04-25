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
      contatos: {
        Row: {
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          responsavel_id: string | null
          tags: string[] | null
          telefone: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          responsavel_id?: string | null
          tags?: string[] | null
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          responsavel_id?: string | null
          tags?: string[] | null
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_historico: {
        Row: {
          data: string
          descricao: string | null
          id: string
          lead_id: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          data?: string
          descricao?: string | null
          id?: string
          lead_id: string
          tipo: string
          user_id?: string | null
        }
        Update: {
          data?: string
          descricao?: string | null
          id?: string
          lead_id?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_historico_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          corretor_id: string | null
          created_at: string
          created_by: string | null
          data_entrada: string
          email: string | null
          etapa_funil: string
          id: string
          imovel_interesse: string | null
          nome: string
          observacoes: string | null
          origem: string | null
          qualificacao: string | null
          status: string
          tags: string[] | null
          telefone: string | null
          ultima_interacao: string | null
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_entrada?: string
          email?: string | null
          etapa_funil?: string
          id?: string
          imovel_interesse?: string | null
          nome: string
          observacoes?: string | null
          origem?: string | null
          qualificacao?: string | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          ultima_interacao?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_entrada?: string
          email?: string | null
          etapa_funil?: string
          id?: string
          imovel_interesse?: string | null
          nome?: string
          observacoes?: string | null
          origem?: string | null
          qualificacao?: string | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          ultima_interacao?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          cargo: string | null
          created_at: string
          email: string | null
          id: string
          nome: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
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
      whatsapp_conversations: {
        Row: {
          contact_name: string | null
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          lead_id: string | null
          phone: string
          responsavel_id: string | null
          unread_count: number
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          lead_id?: string | null
          phone: string
          responsavel_id?: string | null
          unread_count?: number
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          lead_id?: string | null
          phone?: string
          responsavel_id?: string | null
          unread_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          direction: string
          external_id: string | null
          id: string
          media_type: string | null
          media_url: string | null
          status: string
          timestamp: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          direction: string
          external_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          status?: string
          timestamp?: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          direction?: string
          external_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          status?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "gestor" | "corretor"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "gestor", "corretor"],
    },
  },
} as const
