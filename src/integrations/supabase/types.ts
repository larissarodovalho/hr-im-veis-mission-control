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
      activity_log: {
        Row: {
          created_at: string
          descricao: string
          id: string
          metadata: Json | null
          status: string | null
          tipo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          metadata?: Json | null
          status?: string | null
          tipo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          metadata?: Json | null
          status?: string | null
          tipo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agenda_bloqueios: {
        Row: {
          created_at: string
          created_by: string | null
          dia_inteiro: boolean
          fim: string
          id: string
          inicio: string
          motivo: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dia_inteiro?: boolean
          fim: string
          id?: string
          inicio: string
          motivo?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dia_inteiro?: boolean
          fim?: string
          id?: string
          inicio?: string
          motivo?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agenda_ia_log: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          message_id: string | null
          parsed: Json | null
          raw_text: string | null
          reuniao_id: string | null
          status: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          parsed?: Json | null
          raw_text?: string | null
          reuniao_id?: string | null
          status?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          parsed?: Json | null
          raw_text?: string | null
          reuniao_id?: string | null
          status?: string
        }
        Relationships: []
      }
      agentes: {
        Row: {
          created_at: string
          detalhes: string | null
          id: string
          nome: string
          status: string
          tipo: string | null
          ultima_atividade: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          detalhes?: string | null
          id?: string
          nome: string
          status?: string
          tipo?: string | null
          ultima_atividade?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          detalhes?: string | null
          id?: string
          nome?: string
          status?: string
          tipo?: string | null
          ultima_atividade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          updated_at: string
          visitor_email: string | null
          visitor_name: string | null
          visitor_phone: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          updated_at?: string
          visitor_email?: string | null
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          updated_at?: string
          visitor_email?: string | null
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_links: {
        Row: {
          conversation_id: string | null
          created_at: string
          expires_at: string
          id: string
          kind: string
          lead_id: string | null
          nome: string | null
          phone: string | null
          reuniao_id: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          kind: string
          lead_id?: string | null
          nome?: string | null
          phone?: string | null
          reuniao_id?: string | null
          token: string
          used_at?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          kind?: string
          lead_id?: string | null
          nome?: string | null
          phone?: string | null
          reuniao_id?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      campanhas_metrics_daily: {
        Row: {
          campanha_id: string
          cliques: number | null
          created_at: string
          data: string
          gastos: number | null
          id: string
          impressoes: number | null
          leads: number | null
        }
        Insert: {
          campanha_id: string
          cliques?: number | null
          created_at?: string
          data: string
          gastos?: number | null
          id?: string
          impressoes?: number | null
          leads?: number | null
        }
        Update: {
          campanha_id?: string
          cliques?: number | null
          created_at?: string
          data?: string
          gastos?: number | null
          id?: string
          impressoes?: number | null
          leads?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_metrics_daily_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas_trafego"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas_trafego: {
        Row: {
          budget: number | null
          cliques: number | null
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string | null
          external_id: string | null
          gastos: number | null
          id: string
          impressoes: number | null
          leads: number | null
          nome: string
          plataforma: string
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          cliques?: number | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          external_id?: string | null
          gastos?: number | null
          id?: string
          impressoes?: number | null
          leads?: number | null
          nome: string
          plataforma: string
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          cliques?: number | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          external_id?: string | null
          gastos?: number | null
          id?: string
          impressoes?: number | null
          leads?: number | null
          nome?: string
          plataforma?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      conta_propriedades: {
        Row: {
          aptidao: string | null
          conta_id: string
          created_at: string
          created_by: string | null
          id: string
          nome_fazenda: string | null
          observacoes: string | null
          operacao: string | null
          regiao: string | null
          tamanho_ha: number | null
          updated_at: string
          valor_comissao: number | null
          valor_negocio: number | null
        }
        Insert: {
          aptidao?: string | null
          conta_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          nome_fazenda?: string | null
          observacoes?: string | null
          operacao?: string | null
          regiao?: string | null
          tamanho_ha?: number | null
          updated_at?: string
          valor_comissao?: number | null
          valor_negocio?: number | null
        }
        Update: {
          aptidao?: string | null
          conta_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          nome_fazenda?: string | null
          observacoes?: string | null
          operacao?: string | null
          regiao?: string | null
          tamanho_ha?: number | null
          updated_at?: string
          valor_comissao?: number | null
          valor_negocio?: number | null
        }
        Relationships: []
      }
      contas: {
        Row: {
          created_at: string
          created_by: string | null
          documento: string | null
          email: string | null
          endereco: string | null
          etapa_funil: string
          id: string
          interesse: string | null
          is_partner: boolean
          lead_id_origem: string | null
          nome: string
          observacoes: string | null
          responsavel_id: string | null
          status: string
          tags: string[] | null
          telefone: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          documento?: string | null
          email?: string | null
          endereco?: string | null
          etapa_funil?: string
          id?: string
          interesse?: string | null
          is_partner?: boolean
          lead_id_origem?: string | null
          nome: string
          observacoes?: string | null
          responsavel_id?: string | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          documento?: string | null
          email?: string | null
          endereco?: string | null
          etapa_funil?: string
          id?: string
          interesse?: string | null
          is_partner?: boolean
          lead_id_origem?: string | null
          nome?: string
          observacoes?: string | null
          responsavel_id?: string | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      conteudo_posts: {
        Row: {
          created_at: string
          created_by: string | null
          data_planejada: string | null
          formato: string | null
          id: string
          observacoes: string | null
          perfil: string | null
          prioridade: string
          status: string
          tema: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_planejada?: string | null
          formato?: string | null
          id?: string
          observacoes?: string | null
          perfil?: string | null
          prioridade?: string
          status?: string
          tema?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_planejada?: string | null
          formato?: string | null
          id?: string
          observacoes?: string | null
          perfil?: string | null
          prioridade?: string
          status?: string
          tema?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_events: {
        Row: {
          created_at: string
          document_id: string
          event_data: Json | null
          event_type: string
          id: string
          signer_id: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          event_data?: Json | null
          event_type: string
          id?: string
          signer_id?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          signer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "signed_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_events_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "document_signers"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signers: {
        Row: {
          clicksign_signer_key: string | null
          cpf: string | null
          created_at: string
          document_id: string
          email: string
          id: string
          ip_address: string | null
          name: string
          role: string
          sign_url: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["document_signer_status"]
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          clicksign_signer_key?: string | null
          cpf?: string | null
          created_at?: string
          document_id: string
          email: string
          id?: string
          ip_address?: string | null
          name: string
          role?: string
          sign_url?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["document_signer_status"]
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          clicksign_signer_key?: string | null
          cpf?: string | null
          created_at?: string
          document_id?: string
          email?: string
          id?: string
          ip_address?: string | null
          name?: string
          role?: string
          sign_url?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["document_signer_status"]
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_signers_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "signed_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      imoveis: {
        Row: {
          area_total: number | null
          area_util: number | null
          bairro: string | null
          banheiros: number | null
          caracteristicas: string[] | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          corretor_id: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          destaque: boolean
          endereco: string | null
          estado: string | null
          finalidade: string
          fotos: string[] | null
          id: string
          numero: string | null
          quartos: number | null
          status: string
          suites: number | null
          tipo: string
          titulo: string
          updated_at: string
          vagas: number | null
          valor: number | null
          valor_condominio: number | null
          valor_iptu: number | null
        }
        Insert: {
          area_total?: number | null
          area_util?: number | null
          bairro?: string | null
          banheiros?: number | null
          caracteristicas?: string[] | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          destaque?: boolean
          endereco?: string | null
          estado?: string | null
          finalidade?: string
          fotos?: string[] | null
          id?: string
          numero?: string | null
          quartos?: number | null
          status?: string
          suites?: number | null
          tipo?: string
          titulo: string
          updated_at?: string
          vagas?: number | null
          valor?: number | null
          valor_condominio?: number | null
          valor_iptu?: number | null
        }
        Update: {
          area_total?: number | null
          area_util?: number | null
          bairro?: string | null
          banheiros?: number | null
          caracteristicas?: string[] | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          destaque?: boolean
          endereco?: string | null
          estado?: string | null
          finalidade?: string
          fotos?: string[] | null
          id?: string
          numero?: string | null
          quartos?: number | null
          status?: string
          suites?: number | null
          tipo?: string
          titulo?: string
          updated_at?: string
          vagas?: number | null
          valor?: number | null
          valor_condominio?: number | null
          valor_iptu?: number | null
        }
        Relationships: []
      }
      interacoes: {
        Row: {
          agendado_para: string | null
          conta_id: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          lead_id: string | null
          proxima_acao: string | null
          resultado: string | null
          tipo: string
        }
        Insert: {
          agendado_para?: string | null
          conta_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          proxima_acao?: string | null
          resultado?: string | null
          tipo: string
        }
        Update: {
          agendado_para?: string | null
          conta_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          proxima_acao?: string | null
          resultado?: string | null
          tipo?: string
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
          regiao: string | null
          status: string
          tags: string[] | null
          telefone: string | null
          temperatura: string | null
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
          regiao?: string | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          temperatura?: string | null
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
          regiao?: string | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          temperatura?: string | null
          ultima_interacao?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: []
      }
      ligacoes: {
        Row: {
          conta_id: string | null
          corretor_id: string | null
          created_at: string
          created_by: string | null
          data: string
          duracao_seg: number | null
          gravacao_url: string | null
          id: string
          lead_id: string | null
          notas: string | null
          resultado: string | null
        }
        Insert: {
          conta_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          duracao_seg?: number | null
          gravacao_url?: string | null
          id?: string
          lead_id?: string | null
          notas?: string | null
          resultado?: string | null
        }
        Update: {
          conta_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          duracao_seg?: number | null
          gravacao_url?: string | null
          id?: string
          lead_id?: string | null
          notas?: string | null
          resultado?: string | null
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
      notas: {
        Row: {
          autor_id: string
          conteudo: string
          created_at: string
          entidade_id: string
          entidade_tipo: string
          id: string
          updated_at: string
        }
        Insert: {
          autor_id: string
          conteudo: string
          created_at?: string
          entidade_id: string
          entidade_tipo: string
          id?: string
          updated_at?: string
        }
        Update: {
          autor_id?: string
          conteudo?: string
          created_at?: string
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          updated_at?: string
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
      propostas: {
        Row: {
          condicoes: string | null
          corretor_id: string | null
          created_at: string
          created_by: string | null
          data_envio: string | null
          id: string
          imovel_id: string | null
          lead_id: string | null
          observacoes: string | null
          status: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          condicoes?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_envio?: string | null
          id?: string
          imovel_id?: string | null
          lead_id?: string | null
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          condicoes?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_envio?: string | null
          id?: string
          imovel_id?: string | null
          lead_id?: string | null
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "propostas_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      reunioes: {
        Row: {
          agendada_para: string
          conta_id: string | null
          corretor_id: string | null
          created_at: string
          created_by: string | null
          criado_por_ia: boolean
          duracao_min: number
          id: string
          lead_id: string | null
          link: string | null
          local: string | null
          notas: string | null
          status: string
          tipo: string
          titulo: string | null
          updated_at: string
        }
        Insert: {
          agendada_para: string
          conta_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          criado_por_ia?: boolean
          duracao_min?: number
          id?: string
          lead_id?: string | null
          link?: string | null
          local?: string | null
          notas?: string | null
          status?: string
          tipo?: string
          titulo?: string | null
          updated_at?: string
        }
        Update: {
          agendada_para?: string
          conta_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          criado_por_ia?: boolean
          duracao_min?: number
          id?: string
          lead_id?: string | null
          link?: string | null
          local?: string | null
          notas?: string | null
          status?: string
          tipo?: string
          titulo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      signed_documents: {
        Row: {
          canceled_at: string | null
          clicksign_document_key: string | null
          completed_at: string | null
          conta_id: string | null
          created_at: string
          created_by: string | null
          deadline_at: string | null
          file_url: string | null
          id: string
          lead_id: string | null
          message: string | null
          name: string
          sent_at: string | null
          signed_file_url: string | null
          status: Database["public"]["Enums"]["signed_document_status"]
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          clicksign_document_key?: string | null
          completed_at?: string | null
          conta_id?: string | null
          created_at?: string
          created_by?: string | null
          deadline_at?: string | null
          file_url?: string | null
          id?: string
          lead_id?: string | null
          message?: string | null
          name: string
          sent_at?: string | null
          signed_file_url?: string | null
          status?: Database["public"]["Enums"]["signed_document_status"]
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          clicksign_document_key?: string | null
          completed_at?: string | null
          conta_id?: string | null
          created_at?: string
          created_by?: string | null
          deadline_at?: string | null
          file_url?: string | null
          id?: string
          lead_id?: string | null
          message?: string | null
          name?: string
          sent_at?: string | null
          signed_file_url?: string | null
          status?: Database["public"]["Enums"]["signed_document_status"]
          updated_at?: string
        }
        Relationships: []
      }
      social_metrics_daily: {
        Row: {
          alcance: number | null
          created_at: string
          data: string
          engajamento: number | null
          id: string
          posts: number | null
          profile_id: string
          seguidores: number | null
        }
        Insert: {
          alcance?: number | null
          created_at?: string
          data: string
          engajamento?: number | null
          id?: string
          posts?: number | null
          profile_id: string
          seguidores?: number | null
        }
        Update: {
          alcance?: number | null
          created_at?: string
          data?: string
          engajamento?: number | null
          id?: string
          posts?: number | null
          profile_id?: string
          seguidores?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_metrics_daily_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "social_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_profiles: {
        Row: {
          alcance: number | null
          created_at: string
          engajamento: number | null
          external_id: string | null
          handle: string | null
          id: string
          nome: string
          plataforma: string
          posts: number | null
          seguidores: number | null
          updated_at: string
        }
        Insert: {
          alcance?: number | null
          created_at?: string
          engajamento?: number | null
          external_id?: string | null
          handle?: string | null
          id?: string
          nome: string
          plataforma: string
          posts?: number | null
          seguidores?: number | null
          updated_at?: string
        }
        Update: {
          alcance?: number | null
          created_at?: string
          engajamento?: number | null
          external_id?: string | null
          handle?: string | null
          id?: string
          nome?: string
          plataforma?: string
          posts?: number | null
          seguidores?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_health_checks: {
        Row: {
          created_at: string
          detalhe: string | null
          id: string
          servico: string
          status: string
          ultimo_check: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          detalhe?: string | null
          id?: string
          servico: string
          status?: string
          ultimo_check?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          detalhe?: string | null
          id?: string
          servico?: string
          status?: string
          ultimo_check?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          lead_id: string | null
          prazo: string | null
          prioridade: string
          responsavel_id: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          prazo?: string | null
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          prazo?: string | null
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
      visitas: {
        Row: {
          conta_id: string | null
          corretor_id: string | null
          created_at: string
          created_by: string | null
          data_visita: string
          id: string
          imovel_id: string | null
          lead_id: string | null
          observacoes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          conta_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_visita: string
          id?: string
          imovel_id?: string | null
          lead_id?: string | null
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          conta_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_visita?: string
          id?: string
          imovel_id?: string | null
          lead_id?: string | null
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitas_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          ai_enabled: boolean
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
          ai_enabled?: boolean
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
          ai_enabled?: boolean
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
          author: string
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
          author?: string
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
          author?: string
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      normalize_br_phone: { Args: { p: string }; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "corretor"
      document_signer_status: "pending" | "viewed" | "signed" | "refused"
      signed_document_status:
        | "draft"
        | "sent"
        | "partially_signed"
        | "signed"
        | "refused"
        | "expired"
        | "canceled"
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
      document_signer_status: ["pending", "viewed", "signed", "refused"],
      signed_document_status: [
        "draft",
        "sent",
        "partially_signed",
        "signed",
        "refused",
        "expired",
        "canceled",
      ],
    },
  },
} as const
