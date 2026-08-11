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
      captacoes_imovel: {
        Row: {
          checklist_enviado: boolean
          checklist_observacoes: string | null
          conta_id: string
          created_at: string
          created_by: string | null
          data_agendada: string | null
          estagio: string
          google_owner_user_id: string | null
          id: string
          imovel_id: string | null
          observacoes: string | null
          origem: string
          publicado_no_crm: boolean
          responsavel_id: string | null
          updated_at: string
        }
        Insert: {
          checklist_enviado?: boolean
          checklist_observacoes?: string | null
          conta_id: string
          created_at?: string
          created_by?: string | null
          data_agendada?: string | null
          estagio?: string
          google_owner_user_id?: string | null
          id?: string
          imovel_id?: string | null
          observacoes?: string | null
          origem?: string
          publicado_no_crm?: boolean
          responsavel_id?: string | null
          updated_at?: string
        }
        Update: {
          checklist_enviado?: boolean
          checklist_observacoes?: string | null
          conta_id?: string
          created_at?: string
          created_by?: string | null
          data_agendada?: string | null
          estagio?: string
          google_owner_user_id?: string | null
          id?: string
          imovel_id?: string | null
          observacoes?: string | null
          origem?: string
          publicado_no_crm?: boolean
          responsavel_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      carteira_atribuicoes: {
        Row: {
          atribuida_em: string
          conta_id: string
          contato_estabelecido_em: string | null
          corretor_id: string
          corretor_original_id: string
          created_at: string
          created_by: string | null
          encerrada_em: string | null
          gestor_id: string | null
          id: string
          lote_id: string | null
          lote_origem_id: string | null
          modo_selecao: string | null
          motivo_devolucao: string | null
          motivo_encerramento: string | null
          motivo_transferencia: string | null
          observacoes_internas: string | null
          operacao_id: string | null
          oportunidade_id: string | null
          prazo_primeiro_contato: string | null
          primeira_atividade_em: string | null
          proxima_acao: string | null
          proxima_acao_em: string | null
          resultado: string | null
          solicitacao_em: string | null
          solicitacao_motivo: string | null
          solicitacao_tipo: string | null
          status: string
          tentativas: number
          ultima_atividade_em: string | null
          updated_at: string
        }
        Insert: {
          atribuida_em?: string
          conta_id: string
          contato_estabelecido_em?: string | null
          corretor_id: string
          corretor_original_id: string
          created_at?: string
          created_by?: string | null
          encerrada_em?: string | null
          gestor_id?: string | null
          id?: string
          lote_id?: string | null
          lote_origem_id?: string | null
          modo_selecao?: string | null
          motivo_devolucao?: string | null
          motivo_encerramento?: string | null
          motivo_transferencia?: string | null
          observacoes_internas?: string | null
          operacao_id?: string | null
          oportunidade_id?: string | null
          prazo_primeiro_contato?: string | null
          primeira_atividade_em?: string | null
          proxima_acao?: string | null
          proxima_acao_em?: string | null
          resultado?: string | null
          solicitacao_em?: string | null
          solicitacao_motivo?: string | null
          solicitacao_tipo?: string | null
          status?: string
          tentativas?: number
          ultima_atividade_em?: string | null
          updated_at?: string
        }
        Update: {
          atribuida_em?: string
          conta_id?: string
          contato_estabelecido_em?: string | null
          corretor_id?: string
          corretor_original_id?: string
          created_at?: string
          created_by?: string | null
          encerrada_em?: string | null
          gestor_id?: string | null
          id?: string
          lote_id?: string | null
          lote_origem_id?: string | null
          modo_selecao?: string | null
          motivo_devolucao?: string | null
          motivo_encerramento?: string | null
          motivo_transferencia?: string | null
          observacoes_internas?: string | null
          operacao_id?: string | null
          oportunidade_id?: string | null
          prazo_primeiro_contato?: string | null
          primeira_atividade_em?: string | null
          proxima_acao?: string | null
          proxima_acao_em?: string | null
          resultado?: string | null
          solicitacao_em?: string | null
          solicitacao_motivo?: string | null
          solicitacao_tipo?: string | null
          status?: string
          tentativas?: number
          ultima_atividade_em?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carteira_atribuicoes_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carteira_atribuicoes_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "carteira_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carteira_atribuicoes_operacao_id_fkey"
            columns: ["operacao_id"]
            isOneToOne: false
            referencedRelation: "carteira_operacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carteira_atribuicoes_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
        ]
      }
      carteira_eventos: {
        Row: {
          atribuicao_id: string | null
          conta_id: string | null
          created_at: string
          created_by: string | null
          gestor_id: string | null
          id: string
          lote_anterior_id: string | null
          lote_id: string | null
          lote_novo_id: string | null
          metadata: Json
          motivo: string | null
          observacao: string | null
          operacao_id: string | null
          responsavel_anterior_id: string | null
          responsavel_novo_id: string | null
          status_anterior: string | null
          status_novo: string | null
          tipo: string
        }
        Insert: {
          atribuicao_id?: string | null
          conta_id?: string | null
          created_at?: string
          created_by?: string | null
          gestor_id?: string | null
          id?: string
          lote_anterior_id?: string | null
          lote_id?: string | null
          lote_novo_id?: string | null
          metadata?: Json
          motivo?: string | null
          observacao?: string | null
          operacao_id?: string | null
          responsavel_anterior_id?: string | null
          responsavel_novo_id?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          tipo: string
        }
        Update: {
          atribuicao_id?: string | null
          conta_id?: string | null
          created_at?: string
          created_by?: string | null
          gestor_id?: string | null
          id?: string
          lote_anterior_id?: string | null
          lote_id?: string | null
          lote_novo_id?: string | null
          metadata?: Json
          motivo?: string | null
          observacao?: string | null
          operacao_id?: string | null
          responsavel_anterior_id?: string | null
          responsavel_novo_id?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "carteira_eventos_atribuicao_id_fkey"
            columns: ["atribuicao_id"]
            isOneToOne: false
            referencedRelation: "carteira_atribuicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carteira_eventos_operacao_id_fkey"
            columns: ["operacao_id"]
            isOneToOne: false
            referencedRelation: "carteira_operacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      carteira_lotes: {
        Row: {
          corretor_id: string
          created_at: string
          created_by: string | null
          filtros: Json
          gestor_id: string
          id: string
          modo: string
          nome: string
          numero: number
          objetivo: string | null
          observacoes_internas: string | null
          operacao_id: string
          prazo_primeiro_contato_dias: number
          quantidade_definida: number
          quantidade_inicial: number
          status: string
          updated_at: string
        }
        Insert: {
          corretor_id: string
          created_at?: string
          created_by?: string | null
          filtros?: Json
          gestor_id: string
          id?: string
          modo?: string
          nome: string
          numero?: number
          objetivo?: string | null
          observacoes_internas?: string | null
          operacao_id: string
          prazo_primeiro_contato_dias?: number
          quantidade_definida?: number
          quantidade_inicial?: number
          status?: string
          updated_at?: string
        }
        Update: {
          corretor_id?: string
          created_at?: string
          created_by?: string | null
          filtros?: Json
          gestor_id?: string
          id?: string
          modo?: string
          nome?: string
          numero?: number
          objetivo?: string | null
          observacoes_internas?: string | null
          operacao_id?: string
          prazo_primeiro_contato_dias?: number
          quantidade_definida?: number
          quantidade_inicial?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carteira_lotes_operacao_id_fkey"
            columns: ["operacao_id"]
            isOneToOne: false
            referencedRelation: "carteira_operacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      carteira_operacoes: {
        Row: {
          ajustes_manuais: number
          confirmada_em: string | null
          created_at: string
          created_by: string | null
          filtros: Json
          geracoes_automaticas: number
          gestor_id: string
          id: string
          modo: string
          nome: string | null
          observacoes: string | null
          status: string
          total_definido: number
          total_selecionado: number
          updated_at: string
        }
        Insert: {
          ajustes_manuais?: number
          confirmada_em?: string | null
          created_at?: string
          created_by?: string | null
          filtros?: Json
          geracoes_automaticas?: number
          gestor_id: string
          id?: string
          modo?: string
          nome?: string | null
          observacoes?: string | null
          status?: string
          total_definido?: number
          total_selecionado?: number
          updated_at?: string
        }
        Update: {
          ajustes_manuais?: number
          confirmada_em?: string | null
          created_at?: string
          created_by?: string | null
          filtros?: Json
          geracoes_automaticas?: number
          gestor_id?: string
          id?: string
          modo?: string
          nome?: string | null
          observacoes?: string | null
          status?: string
          total_definido?: number
          total_selecionado?: number
          updated_at?: string
        }
        Relationships: []
      }
      carteira_selecao_itens: {
        Row: {
          conta_id: string
          created_at: string
          created_by: string | null
          id: string
          lote_id: string
          operacao_id: string
          origem: string
        }
        Insert: {
          conta_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          lote_id: string
          operacao_id: string
          origem?: string
        }
        Update: {
          conta_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lote_id?: string
          operacao_id?: string
          origem?: string
        }
        Relationships: [
          {
            foreignKeyName: "carteira_selecao_itens_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carteira_selecao_itens_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "carteira_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carteira_selecao_itens_operacao_id_fkey"
            columns: ["operacao_id"]
            isOneToOne: false
            referencedRelation: "carteira_operacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      conta_fechamentos: {
        Row: {
          conta_id: string
          created_at: string
          created_by: string | null
          data_fechamento: string
          id: string
          imovel_id: string | null
          observacoes: string | null
          oportunidade_id: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          conta_id: string
          created_at?: string
          created_by?: string | null
          data_fechamento: string
          id?: string
          imovel_id?: string | null
          observacoes?: string | null
          oportunidade_id?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          conta_id?: string
          created_at?: string
          created_by?: string | null
          data_fechamento?: string
          id?: string
          imovel_id?: string | null
          observacoes?: string | null
          oportunidade_id?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conta_fechamentos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conta_fechamentos_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conta_fechamentos_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conta_fechamentos_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
        ]
      }
      conta_propostas: {
        Row: {
          conta_id: string
          corretor_id: string | null
          created_at: string
          created_by: string | null
          data_proposta: string
          descricao: string | null
          id: string
          imovel_id: string | null
          oportunidade_id: string | null
          oportunidade_proposta_id: string | null
          status: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          conta_id: string
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_proposta: string
          descricao?: string | null
          id?: string
          imovel_id?: string | null
          oportunidade_id?: string | null
          oportunidade_proposta_id?: string | null
          status?: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          conta_id?: string
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_proposta?: string
          descricao?: string | null
          id?: string
          imovel_id?: string | null
          oportunidade_id?: string | null
          oportunidade_proposta_id?: string | null
          status?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conta_propostas_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conta_propostas_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conta_propostas_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conta_propostas_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
        ]
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
          cancelado_em: string | null
          cancelado_por: string | null
          categoria: string | null
          created_at: string
          created_by: string | null
          data_entrada_carteira: string | null
          desclassificada: boolean
          destino_comercial: string | null
          documento: string | null
          email: string | null
          endereco: string | null
          etapa_funil: string
          id: string
          interesse: string | null
          is_partner: boolean
          lead_id_origem: string | null
          motivo_cancelamento: string | null
          motivo_desclassificacao: string | null
          nome: string
          observacoes: string | null
          origem: string | null
          parceiro_origem_id: string | null
          proxima_acao_em: string | null
          qualificacao_em: string | null
          qualificacao_por: string | null
          qualificacao_status: string | null
          ramo_atividade: string | null
          responsavel_id: string | null
          status: string
          tags: string[] | null
          telefone: string | null
          temperatura: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          cancelado_em?: string | null
          cancelado_por?: string | null
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          data_entrada_carteira?: string | null
          desclassificada?: boolean
          destino_comercial?: string | null
          documento?: string | null
          email?: string | null
          endereco?: string | null
          etapa_funil?: string
          id?: string
          interesse?: string | null
          is_partner?: boolean
          lead_id_origem?: string | null
          motivo_cancelamento?: string | null
          motivo_desclassificacao?: string | null
          nome: string
          observacoes?: string | null
          origem?: string | null
          parceiro_origem_id?: string | null
          proxima_acao_em?: string | null
          qualificacao_em?: string | null
          qualificacao_por?: string | null
          qualificacao_status?: string | null
          ramo_atividade?: string | null
          responsavel_id?: string | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          temperatura?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          cancelado_em?: string | null
          cancelado_por?: string | null
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          data_entrada_carteira?: string | null
          desclassificada?: boolean
          destino_comercial?: string | null
          documento?: string | null
          email?: string | null
          endereco?: string | null
          etapa_funil?: string
          id?: string
          interesse?: string | null
          is_partner?: boolean
          lead_id_origem?: string | null
          motivo_cancelamento?: string | null
          motivo_desclassificacao?: string | null
          nome?: string
          observacoes?: string | null
          origem?: string | null
          parceiro_origem_id?: string | null
          proxima_acao_em?: string | null
          qualificacao_em?: string | null
          qualificacao_por?: string | null
          qualificacao_status?: string | null
          ramo_atividade?: string | null
          responsavel_id?: string | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          temperatura?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_parceiro_origem_id_fkey"
            columns: ["parceiro_origem_id"]
            isOneToOne: false
            referencedRelation: "corretores_parceiros"
            referencedColumns: ["id"]
          },
        ]
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
      contrato_templates: {
        Row: {
          ativo: boolean
          conteudo: string
          created_at: string
          created_by: string | null
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          conteudo: string
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          conteudo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      contratos: {
        Row: {
          cliente_documento: string | null
          cliente_email: string | null
          cliente_endereco: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          comissao_percentual: number | null
          conta_id: string | null
          conteudo_renderizado: string | null
          corretor_id: string | null
          created_at: string
          created_by: string | null
          dados_partes: Json | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          imovel_id: string | null
          lead_id: string | null
          observacoes: string | null
          pdf_url: string | null
          prazo_dias: number | null
          signed_document_id: string | null
          status: string
          template_id: string | null
          tipo: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          cliente_documento?: string | null
          cliente_email?: string | null
          cliente_endereco?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          comissao_percentual?: number | null
          conta_id?: string | null
          conteudo_renderizado?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          dados_partes?: Json | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          imovel_id?: string | null
          lead_id?: string | null
          observacoes?: string | null
          pdf_url?: string | null
          prazo_dias?: number | null
          signed_document_id?: string | null
          status?: string
          template_id?: string | null
          tipo?: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          cliente_documento?: string | null
          cliente_email?: string | null
          cliente_endereco?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          comissao_percentual?: number | null
          conta_id?: string | null
          conteudo_renderizado?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          dados_partes?: Json | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          imovel_id?: string | null
          lead_id?: string | null
          observacoes?: string | null
          pdf_url?: string | null
          prazo_dias?: number | null
          signed_document_id?: string | null
          status?: string
          template_id?: string | null
          tipo?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contrato_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      corretores_parceiros: {
        Row: {
          ativo: boolean
          cidade: string | null
          comissao_padrao: number | null
          created_at: string
          created_by: string | null
          creci: string | null
          dados_bancarios: string | null
          documento: string | null
          email: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          comissao_padrao?: number | null
          created_at?: string
          created_by?: string | null
          creci?: string | null
          dados_bancarios?: string | null
          documento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          comissao_padrao?: number | null
          created_at?: string
          created_by?: string | null
          creci?: string | null
          dados_bancarios?: string | null
          documento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
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
      google_calendar_sync: {
        Row: {
          calendar_id: string
          created_at: string
          entity_id: string
          entity_type: string
          etag: string | null
          google_event_id: string
          html_link: string | null
          id: string
          last_synced_at: string
          user_id: string
        }
        Insert: {
          calendar_id?: string
          created_at?: string
          entity_id: string
          entity_type: string
          etag?: string | null
          google_event_id: string
          html_link?: string | null
          id?: string
          last_synced_at?: string
          user_id: string
        }
        Update: {
          calendar_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          etag?: string | null
          google_event_id?: string
          html_link?: string | null
          id?: string
          last_synced_at?: string
          user_id?: string
        }
        Relationships: []
      }
      imoveis: {
        Row: {
          area_construida: number | null
          area_total: number | null
          area_util: number | null
          bairro: string | null
          banheiros: number | null
          caracteristicas: string[] | null
          cep: string | null
          cidade: string | null
          codigo: string | null
          complemento: string | null
          corretor_captador_id: string | null
          corretor_id: string | null
          corretor_parceiro_id: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          destaque: boolean
          endereco: string | null
          estado: string | null
          exclusividade_fim: string | null
          exclusividade_inicio: string | null
          exclusividade_observacoes: string | null
          finalidade: string
          fotos: string[] | null
          id: string
          matricula: string | null
          numero: string | null
          proprietario_id: string | null
          publicado: boolean
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
          area_construida?: number | null
          area_total?: number | null
          area_util?: number | null
          bairro?: string | null
          banheiros?: number | null
          caracteristicas?: string[] | null
          cep?: string | null
          cidade?: string | null
          codigo?: string | null
          complemento?: string | null
          corretor_captador_id?: string | null
          corretor_id?: string | null
          corretor_parceiro_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          destaque?: boolean
          endereco?: string | null
          estado?: string | null
          exclusividade_fim?: string | null
          exclusividade_inicio?: string | null
          exclusividade_observacoes?: string | null
          finalidade?: string
          fotos?: string[] | null
          id?: string
          matricula?: string | null
          numero?: string | null
          proprietario_id?: string | null
          publicado?: boolean
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
          area_construida?: number | null
          area_total?: number | null
          area_util?: number | null
          bairro?: string | null
          banheiros?: number | null
          caracteristicas?: string[] | null
          cep?: string | null
          cidade?: string | null
          codigo?: string | null
          complemento?: string | null
          corretor_captador_id?: string | null
          corretor_id?: string | null
          corretor_parceiro_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          destaque?: boolean
          endereco?: string | null
          estado?: string | null
          exclusividade_fim?: string | null
          exclusividade_inicio?: string | null
          exclusividade_observacoes?: string | null
          finalidade?: string
          fotos?: string[] | null
          id?: string
          matricula?: string | null
          numero?: string | null
          proprietario_id?: string | null
          publicado?: boolean
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
      imovel_documentos: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          imovel_id: string
          mime_type: string
          nome: string
          storage_path: string
          tamanho_bytes: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          imovel_id: string
          mime_type?: string
          nome: string
          storage_path: string
          tamanho_bytes?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          imovel_id?: string
          mime_type?: string
          nome?: string
          storage_path?: string
          tamanho_bytes?: number | null
        }
        Relationships: []
      }
      interacoes: {
        Row: {
          agendado_para: string | null
          atribuicao_id: string | null
          canal: string | null
          conta_id: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          lead_id: string | null
          oportunidade_id: string | null
          pontualidade: string | null
          proxima_acao: string | null
          resultado: string | null
          tipo: string
        }
        Insert: {
          agendado_para?: string | null
          atribuicao_id?: string | null
          canal?: string | null
          conta_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          oportunidade_id?: string | null
          pontualidade?: string | null
          proxima_acao?: string | null
          resultado?: string | null
          tipo: string
        }
        Update: {
          agendado_para?: string | null
          atribuicao_id?: string | null
          canal?: string | null
          conta_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          oportunidade_id?: string | null
          pontualidade?: string | null
          proxima_acao?: string | null
          resultado?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "interacoes_atribuicao_id_fkey"
            columns: ["atribuicao_id"]
            isOneToOne: false
            referencedRelation: "carteira_atribuicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacoes_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
        ]
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
          meta_form_data: Json | null
          motivo_desclassificacao: string | null
          nome: string
          observacoes: string | null
          origem: string | null
          qualificacao: string | null
          regiao: string | null
          status: string
          tags: string[] | null
          telefone: string | null
          temperatura: string | null
          tipo_acompanhamento: string | null
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
          meta_form_data?: Json | null
          motivo_desclassificacao?: string | null
          nome: string
          observacoes?: string | null
          origem?: string | null
          qualificacao?: string | null
          regiao?: string | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          temperatura?: string | null
          tipo_acompanhamento?: string | null
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
          meta_form_data?: Json | null
          motivo_desclassificacao?: string | null
          nome?: string
          observacoes?: string | null
          origem?: string | null
          qualificacao?: string | null
          regiao?: string | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          temperatura?: string | null
          tipo_acompanhamento?: string | null
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
          google_owner_user_id: string | null
          gravacao_url: string | null
          id: string
          lead_id: string | null
          notas: string | null
          origem: string
          publicado_no_crm: boolean
          resultado: string | null
        }
        Insert: {
          conta_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          duracao_seg?: number | null
          google_owner_user_id?: string | null
          gravacao_url?: string | null
          id?: string
          lead_id?: string | null
          notas?: string | null
          origem?: string
          publicado_no_crm?: boolean
          resultado?: string | null
        }
        Update: {
          conta_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          duracao_seg?: number | null
          google_owner_user_id?: string | null
          gravacao_url?: string | null
          id?: string
          lead_id?: string | null
          notas?: string | null
          origem?: string
          publicado_no_crm?: boolean
          resultado?: string | null
        }
        Relationships: []
      }
      meta_ads_imoveis: {
        Row: {
          ad_id: string
          ativo: boolean
          created_at: string
          created_by: string | null
          id: string
          imovel_id: string
          nome_anuncio: string | null
          updated_at: string
        }
        Insert: {
          ad_id: string
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          imovel_id: string
          nome_anuncio?: string | null
          updated_at?: string
        }
        Update: {
          ad_id?: string
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          imovel_id?: string
          nome_anuncio?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_ads_imoveis_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_ads_imoveis_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis_public"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_ads_referrals: {
        Row: {
          ad_id: string | null
          body: string | null
          conversation_id: string | null
          created_at: string
          id: string
          imovel_id_resolvido: string | null
          lead_id: string | null
          raw: Json | null
          source_url: string | null
          thumbnail_url: string | null
          title: string | null
        }
        Insert: {
          ad_id?: string | null
          body?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          imovel_id_resolvido?: string | null
          lead_id?: string | null
          raw?: Json | null
          source_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
        }
        Update: {
          ad_id?: string | null
          body?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          imovel_id_resolvido?: string | null
          lead_id?: string | null
          raw?: Json | null
          source_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_ads_referrals_imovel_id_resolvido_fkey"
            columns: ["imovel_id_resolvido"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_ads_referrals_imovel_id_resolvido_fkey"
            columns: ["imovel_id_resolvido"]
            isOneToOne: false
            referencedRelation: "imoveis_public"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_lead_forms: {
        Row: {
          ativo: boolean
          corretor_responsavel_id: string | null
          created_at: string
          created_by: string | null
          etapa_funil_inicial: string
          form_id: string
          form_nome: string
          id: string
          page_id: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          corretor_responsavel_id?: string | null
          created_at?: string
          created_by?: string | null
          etapa_funil_inicial?: string
          form_id: string
          form_nome: string
          id?: string
          page_id: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          corretor_responsavel_id?: string | null
          created_at?: string
          created_by?: string | null
          etapa_funil_inicial?: string
          form_id?: string
          form_nome?: string
          id?: string
          page_id?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_campanhas: {
        Row: {
          aprovada_em: string | null
          aprovada_por: string | null
          assunto: string
          corpo: string | null
          created_at: string
          criada_por: string | null
          enviada_em: string | null
          id: string
          imoveis_ids: string[]
          manchete: string | null
          status: string
          total_destinatarios: number
          total_enviados: number
          total_falhas: number
          updated_at: string
        }
        Insert: {
          aprovada_em?: string | null
          aprovada_por?: string | null
          assunto: string
          corpo?: string | null
          created_at?: string
          criada_por?: string | null
          enviada_em?: string | null
          id?: string
          imoveis_ids?: string[]
          manchete?: string | null
          status?: string
          total_destinatarios?: number
          total_enviados?: number
          total_falhas?: number
          updated_at?: string
        }
        Update: {
          aprovada_em?: string | null
          aprovada_por?: string | null
          assunto?: string
          corpo?: string | null
          created_at?: string
          criada_por?: string | null
          enviada_em?: string | null
          id?: string
          imoveis_ids?: string[]
          manchete?: string | null
          status?: string
          total_destinatarios?: number
          total_enviados?: number
          total_falhas?: number
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_envios: {
        Row: {
          campanha_id: string
          created_at: string
          email: string
          error_message: string | null
          id: string
          sent_at: string | null
          status: string
          subscriber_id: string | null
        }
        Insert: {
          campanha_id: string
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          subscriber_id?: string | null
        }
        Update: {
          campanha_id?: string
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_envios_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "newsletter_campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_envios_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string | null
          status: string
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome?: string | null
          status?: string
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string | null
          status?: string
          telefone?: string | null
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
      oportunidade_imoveis: {
        Row: {
          apresentado_em: string | null
          apresentado_por: string | null
          created_at: string
          created_by: string | null
          feedback_cliente: string | null
          id: string
          imovel_id: string
          interesse: string | null
          motivo_rejeicao: string | null
          observacao: string | null
          oportunidade_id: string
          status: string
        }
        Insert: {
          apresentado_em?: string | null
          apresentado_por?: string | null
          created_at?: string
          created_by?: string | null
          feedback_cliente?: string | null
          id?: string
          imovel_id: string
          interesse?: string | null
          motivo_rejeicao?: string | null
          observacao?: string | null
          oportunidade_id: string
          status?: string
        }
        Update: {
          apresentado_em?: string | null
          apresentado_por?: string | null
          created_at?: string
          created_by?: string | null
          feedback_cliente?: string | null
          id?: string
          imovel_id?: string
          interesse?: string | null
          motivo_rejeicao?: string | null
          observacao?: string | null
          oportunidade_id?: string
          status?: string
        }
        Relationships: []
      }
      oportunidade_propostas: {
        Row: {
          condicoes: string | null
          conta_id: string | null
          conta_proposta_id: string | null
          created_at: string
          created_by: string | null
          entrada: number | null
          financiamento: string | null
          forma_pagamento: string | null
          id: string
          imovel_id: string | null
          imovel_permuta: string | null
          observacoes: string | null
          oportunidade_id: string
          parcelamento: string | null
          possui_permuta: boolean
          prazos: string | null
          status: string
          updated_at: string
          validade: string | null
          valor_estimado_permuta: number | null
          valor_pedido: number | null
          valor_proposto: number | null
        }
        Insert: {
          condicoes?: string | null
          conta_id?: string | null
          conta_proposta_id?: string | null
          created_at?: string
          created_by?: string | null
          entrada?: number | null
          financiamento?: string | null
          forma_pagamento?: string | null
          id?: string
          imovel_id?: string | null
          imovel_permuta?: string | null
          observacoes?: string | null
          oportunidade_id: string
          parcelamento?: string | null
          possui_permuta?: boolean
          prazos?: string | null
          status?: string
          updated_at?: string
          validade?: string | null
          valor_estimado_permuta?: number | null
          valor_pedido?: number | null
          valor_proposto?: number | null
        }
        Update: {
          condicoes?: string | null
          conta_id?: string | null
          conta_proposta_id?: string | null
          created_at?: string
          created_by?: string | null
          entrada?: number | null
          financiamento?: string | null
          forma_pagamento?: string | null
          id?: string
          imovel_id?: string | null
          imovel_permuta?: string | null
          observacoes?: string | null
          oportunidade_id?: string
          parcelamento?: string | null
          possui_permuta?: boolean
          prazos?: string | null
          status?: string
          updated_at?: string
          validade?: string | null
          valor_estimado_permuta?: number | null
          valor_pedido?: number | null
          valor_proposto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oportunidade_propostas_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidade_propostas_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidade_propostas_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidade_propostas_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
        ]
      }
      oportunidade_visitas: {
        Row: {
          conta_id: string | null
          corretor_id: string | null
          created_at: string
          created_by: string | null
          data_visita: string
          feedback: string | null
          id: string
          imovel_id: string | null
          interesse_cliente: string | null
          local: string | null
          objeções: string | null
          observacao: string | null
          oportunidade_id: string
          pontos_positivos: string | null
          proxima_acao: string | null
          status: string
          updated_at: string
        }
        Insert: {
          conta_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_visita: string
          feedback?: string | null
          id?: string
          imovel_id?: string | null
          interesse_cliente?: string | null
          local?: string | null
          objeções?: string | null
          observacao?: string | null
          oportunidade_id: string
          pontos_positivos?: string | null
          proxima_acao?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          conta_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_visita?: string
          feedback?: string | null
          id?: string
          imovel_id?: string | null
          interesse_cliente?: string | null
          local?: string | null
          objeções?: string | null
          observacao?: string | null
          oportunidade_id?: string
          pontos_positivos?: string | null
          proxima_acao?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oportunidade_visitas_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidade_visitas_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidade_visitas_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidade_visitas_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
        ]
      }
      oportunidades: {
        Row: {
          atribuicao_id: string | null
          bairro: string | null
          caracteristicas_indispensaveis: string | null
          categoria_origem: string | null
          chave_idempotencia: string | null
          cidade: string | null
          cliente_id: string
          cliente_tipo: string
          conta_id: string | null
          corretor_gerador_id: string | null
          corretor_id: string | null
          corretor_original_id: string | null
          created_at: string
          created_by: string | null
          data_diagnostico: string | null
          data_fechamento: string | null
          descricao_busca: string | null
          destino_conta_perda: string | null
          diagnostico_por: string | null
          encerrada_em: string | null
          encerrada_por: string | null
          estagio: string
          estagio_desde: string
          forma_pagamento: string | null
          id: string
          imovel_fechamento_id: string | null
          imovel_permuta: string | null
          lead_id_origem: string | null
          lote_id: string | null
          motivo_perda: string | null
          obs_perda: string | null
          observacoes: string | null
          operacao_id: string | null
          origem: string | null
          possibilidade_financiamento: boolean
          possui_permuta: boolean
          prazo_pretendido: string | null
          prioridade: string
          proposta_aceita_id: string | null
          tipo_imovel: string | null
          titulo: string
          updated_at: string
          valor_alvo: number | null
          valor_estimado_permuta: number | null
          valor_final: number | null
        }
        Insert: {
          atribuicao_id?: string | null
          bairro?: string | null
          caracteristicas_indispensaveis?: string | null
          categoria_origem?: string | null
          chave_idempotencia?: string | null
          cidade?: string | null
          cliente_id: string
          cliente_tipo: string
          conta_id?: string | null
          corretor_gerador_id?: string | null
          corretor_id?: string | null
          corretor_original_id?: string | null
          created_at?: string
          created_by?: string | null
          data_diagnostico?: string | null
          data_fechamento?: string | null
          descricao_busca?: string | null
          destino_conta_perda?: string | null
          diagnostico_por?: string | null
          encerrada_em?: string | null
          encerrada_por?: string | null
          estagio?: string
          estagio_desde?: string
          forma_pagamento?: string | null
          id?: string
          imovel_fechamento_id?: string | null
          imovel_permuta?: string | null
          lead_id_origem?: string | null
          lote_id?: string | null
          motivo_perda?: string | null
          obs_perda?: string | null
          observacoes?: string | null
          operacao_id?: string | null
          origem?: string | null
          possibilidade_financiamento?: boolean
          possui_permuta?: boolean
          prazo_pretendido?: string | null
          prioridade?: string
          proposta_aceita_id?: string | null
          tipo_imovel?: string | null
          titulo: string
          updated_at?: string
          valor_alvo?: number | null
          valor_estimado_permuta?: number | null
          valor_final?: number | null
        }
        Update: {
          atribuicao_id?: string | null
          bairro?: string | null
          caracteristicas_indispensaveis?: string | null
          categoria_origem?: string | null
          chave_idempotencia?: string | null
          cidade?: string | null
          cliente_id?: string
          cliente_tipo?: string
          conta_id?: string | null
          corretor_gerador_id?: string | null
          corretor_id?: string | null
          corretor_original_id?: string | null
          created_at?: string
          created_by?: string | null
          data_diagnostico?: string | null
          data_fechamento?: string | null
          descricao_busca?: string | null
          destino_conta_perda?: string | null
          diagnostico_por?: string | null
          encerrada_em?: string | null
          encerrada_por?: string | null
          estagio?: string
          estagio_desde?: string
          forma_pagamento?: string | null
          id?: string
          imovel_fechamento_id?: string | null
          imovel_permuta?: string | null
          lead_id_origem?: string | null
          lote_id?: string | null
          motivo_perda?: string | null
          obs_perda?: string | null
          observacoes?: string | null
          operacao_id?: string | null
          origem?: string | null
          possibilidade_financiamento?: boolean
          possui_permuta?: boolean
          prazo_pretendido?: string | null
          prioridade?: string
          proposta_aceita_id?: string | null
          tipo_imovel?: string | null
          titulo?: string
          updated_at?: string
          valor_alvo?: number | null
          valor_estimado_permuta?: number | null
          valor_final?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_atribuicao_id_fkey"
            columns: ["atribuicao_id"]
            isOneToOne: false
            referencedRelation: "carteira_atribuicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_imovel_fechamento_id_fkey"
            columns: ["imovel_fechamento_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_imovel_fechamento_id_fkey"
            columns: ["imovel_fechamento_id"]
            isOneToOne: false
            referencedRelation: "imoveis_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_lead_id_origem_fkey"
            columns: ["lead_id_origem"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "carteira_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_operacao_id_fkey"
            columns: ["operacao_id"]
            isOneToOne: false
            referencedRelation: "carteira_operacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_proposta_aceita_fk"
            columns: ["proposta_aceita_id"]
            isOneToOne: false
            referencedRelation: "oportunidade_propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          cargo: string | null
          created_at: string
          email: string | null
          id: string
          nivel: string
          nome: string | null
          notify_new_leads: boolean
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
          nivel?: string
          nome?: string | null
          notify_new_leads?: boolean
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
          nivel?: string
          nome?: string | null
          notify_new_leads?: boolean
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
          documento_nome: string | null
          documento_url: string | null
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
          documento_nome?: string | null
          documento_url?: string | null
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
          documento_nome?: string | null
          documento_url?: string | null
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
            foreignKeyName: "propostas_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis_public"
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
          google_owner_user_id: string | null
          id: string
          imovel_id: string | null
          lead_id: string | null
          link: string | null
          local: string | null
          notas: string | null
          origem: string
          publicado_no_crm: boolean
          recorrencia_id: string | null
          recorrencia_regra: string | null
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
          google_owner_user_id?: string | null
          id?: string
          imovel_id?: string | null
          lead_id?: string | null
          link?: string | null
          local?: string | null
          notas?: string | null
          origem?: string
          publicado_no_crm?: boolean
          recorrencia_id?: string | null
          recorrencia_regra?: string | null
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
          google_owner_user_id?: string | null
          id?: string
          imovel_id?: string | null
          lead_id?: string | null
          link?: string | null
          local?: string | null
          notas?: string | null
          origem?: string
          publicado_no_crm?: boolean
          recorrencia_id?: string | null
          recorrencia_regra?: string | null
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
      site_settings: {
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
      site_visits: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
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
          conta_id: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          lead_id: string | null
          oportunidade_id: string | null
          prazo: string | null
          prioridade: string
          responsavel_id: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          conta_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          oportunidade_id?: string | null
          prazo?: string | null
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          conta_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          oportunidade_id?: string | null
          prazo?: string | null
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
        ]
      }
      user_google_calendar: {
        Row: {
          access_token: string
          calendar_id: string
          connected_at: string
          created_at: string
          google_email: string
          id: string
          last_sync_at: string | null
          last_sync_error: string | null
          refresh_token: string
          scope: string | null
          sync_token: string | null
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string
          connected_at?: string
          created_at?: string
          google_email: string
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          refresh_token: string
          scope?: string | null
          sync_token?: string | null
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string
          connected_at?: string
          created_at?: string
          google_email?: string
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          refresh_token?: string
          scope?: string | null
          sync_token?: string | null
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_menu_access: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          menu_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed: boolean
          created_at?: string
          id?: string
          menu_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          menu_key?: string
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
      vendas: {
        Row: {
          cliente_nome: string
          conta_id: string | null
          contrato_pdf_path: string | null
          corretor_captador_id: string | null
          corretor_id: string | null
          corretor_parceiro_id: string | null
          corretor_vendedor_id: string | null
          created_at: string
          created_by: string | null
          data_venda: string
          id: string
          imovel_id: string | null
          lead_id: string | null
          nivel_corretor: string | null
          observacoes: string | null
          origem: string | null
          origem_negocio: string | null
          percent_captador: number
          percent_hr: number
          percent_vendedor: number
          percentual_comissao: number | null
          proposta_id: string | null
          status_pagamento: string
          tipo: string
          updated_at: string
          valor_comissao: number
          valor_venda: number
        }
        Insert: {
          cliente_nome: string
          conta_id?: string | null
          contrato_pdf_path?: string | null
          corretor_captador_id?: string | null
          corretor_id?: string | null
          corretor_parceiro_id?: string | null
          corretor_vendedor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_venda?: string
          id?: string
          imovel_id?: string | null
          lead_id?: string | null
          nivel_corretor?: string | null
          observacoes?: string | null
          origem?: string | null
          origem_negocio?: string | null
          percent_captador?: number
          percent_hr?: number
          percent_vendedor?: number
          percentual_comissao?: number | null
          proposta_id?: string | null
          status_pagamento?: string
          tipo?: string
          updated_at?: string
          valor_comissao?: number
          valor_venda?: number
        }
        Update: {
          cliente_nome?: string
          conta_id?: string | null
          contrato_pdf_path?: string | null
          corretor_captador_id?: string | null
          corretor_id?: string | null
          corretor_parceiro_id?: string | null
          corretor_vendedor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_venda?: string
          id?: string
          imovel_id?: string | null
          lead_id?: string | null
          nivel_corretor?: string | null
          observacoes?: string | null
          origem?: string | null
          origem_negocio?: string | null
          percent_captador?: number
          percent_hr?: number
          percent_vendedor?: number
          percentual_comissao?: number | null
          proposta_id?: string | null
          status_pagamento?: string
          tipo?: string
          updated_at?: string
          valor_comissao?: number
          valor_venda?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      visitas: {
        Row: {
          conta_id: string | null
          corretor_id: string | null
          created_at: string
          created_by: string | null
          data_visita: string
          google_owner_user_id: string | null
          id: string
          imovel_id: string | null
          lead_id: string | null
          observacoes: string | null
          origem: string
          publicado_no_crm: boolean
          status: string
          updated_at: string
        }
        Insert: {
          conta_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_visita: string
          google_owner_user_id?: string | null
          id?: string
          imovel_id?: string | null
          lead_id?: string | null
          observacoes?: string | null
          origem?: string
          publicado_no_crm?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          conta_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_visita?: string
          google_owner_user_id?: string | null
          id?: string
          imovel_id?: string | null
          lead_id?: string | null
          observacoes?: string | null
          origem?: string
          publicado_no_crm?: boolean
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
            foreignKeyName: "visitas_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis_public"
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
          ai_debounce_token: string | null
          ai_enabled: boolean
          ai_pending_since: string | null
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
          ai_debounce_token?: string | null
          ai_enabled?: boolean
          ai_pending_since?: string | null
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
          ai_debounce_token?: string | null
          ai_enabled?: boolean
          ai_pending_since?: string | null
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
      imoveis_public: {
        Row: {
          area_construida: number | null
          area_total: number | null
          area_util: number | null
          bairro: string | null
          banheiros: number | null
          caracteristicas: string[] | null
          cep: string | null
          cidade: string | null
          codigo: string | null
          complemento: string | null
          created_at: string | null
          descricao: string | null
          destaque: boolean | null
          endereco: string | null
          estado: string | null
          finalidade: string | null
          fotos: string[] | null
          id: string | null
          numero: string | null
          quartos: number | null
          status: string | null
          suites: number | null
          tipo: string | null
          titulo: string | null
          updated_at: string | null
          vagas: number | null
          valor: number | null
          valor_condominio: number | null
          valor_iptu: number | null
        }
        Insert: {
          area_construida?: number | null
          area_total?: number | null
          area_util?: number | null
          bairro?: string | null
          banheiros?: number | null
          caracteristicas?: string[] | null
          cep?: string | null
          cidade?: string | null
          codigo?: string | null
          complemento?: string | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          endereco?: string | null
          estado?: string | null
          finalidade?: string | null
          fotos?: string[] | null
          id?: string | null
          numero?: string | null
          quartos?: number | null
          status?: string | null
          suites?: number | null
          tipo?: string | null
          titulo?: string | null
          updated_at?: string | null
          vagas?: number | null
          valor?: number | null
          valor_condominio?: number | null
          valor_iptu?: number | null
        }
        Update: {
          area_construida?: number | null
          area_total?: number | null
          area_util?: number | null
          bairro?: string | null
          banheiros?: number | null
          caracteristicas?: string[] | null
          cep?: string | null
          cidade?: string | null
          codigo?: string | null
          complemento?: string | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          endereco?: string | null
          estado?: string | null
          finalidade?: string | null
          fotos?: string[] | null
          id?: string | null
          numero?: string | null
          quartos?: number | null
          status?: string | null
          suites?: number | null
          tipo?: string | null
          titulo?: string | null
          updated_at?: string | null
          vagas?: number | null
          valor?: number | null
          valor_condominio?: number | null
          valor_iptu?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      carteira_agendar_proxima: {
        Args: {
          _atribuicao_id: string
          _descricao?: string
          _quando: string
          _titulo?: string
        }
        Returns: Json
      }
      carteira_atrib_permitida: {
        Args: {
          _a: Database["public"]["Tables"]["carteira_atribuicoes"]["Row"]
        }
        Returns: boolean
      }
      carteira_confirmar_distribuicao: {
        Args: { _operacao_id: string }
        Returns: Json
      }
      carteira_elegiveis: {
        Args: { _filtros?: Json; _q?: string }
        Returns: {
          categoria: string
          created_at: string
          email: string
          endereco: string
          etapa_funil: string
          id: string
          interesse: string
          nome: string
          origem: string
          responsavel_id: string
          tags: string[]
          telefone: string
          temperatura: string
        }[]
      }
      carteira_elegiveis_count: {
        Args: { _filtros?: Json; _q?: string }
        Returns: number
      }
      carteira_eventos_conta: {
        Args: { _conta_id: string }
        Returns: {
          autor: string
          created_at: string
          id: string
          lote_nome: string
          motivo: string
          observacao: string
          responsavel_anterior: string
          responsavel_novo: string
          status_anterior: string
          status_novo: string
          tipo: string
        }[]
      }
      carteira_gerar_selecao: { Args: { _operacao_id: string }; Returns: Json }
      carteira_gestor_acao: {
        Args: {
          _acao: string
          _atribuicao_id: string
          _motivo?: string
          _novo_corretor?: string
        }
        Returns: Json
      }
      carteira_lote_da_conta: {
        Args: { _conta_id: string }
        Returns: {
          atribuida_em: string
          corretor_id: string
          lote_nome: string
        }[]
      }
      carteira_marcar_contato: {
        Args: { _atribuicao_id: string; _descricao?: string }
        Returns: Json
      }
      carteira_minha_carteira: {
        Args: { _corretor?: string }
        Returns: {
          atribuicao_id: string
          atribuida_em: string
          categoria: string
          conta_id: string
          conta_nome: string
          contato_estabelecido_em: string
          corretor_id: string
          email: string
          encerrada_em: string
          etapa_funil: string
          gestor_id: string
          interesse: string
          lote_id: string
          lote_nome: string
          lote_numero: number
          motivo_encerramento: string
          origem: string
          prazo_primeiro_contato: string
          primeira_atividade_em: string
          proxima_acao: string
          proxima_acao_em: string
          solicitacao_em: string
          solicitacao_motivo: string
          solicitacao_tipo: string
          status: string
          telefone: string
          tem_oportunidade: boolean
          tentativas: number
          ultima_atividade_em: string
        }[]
      }
      carteira_registrar_tentativa: {
        Args: {
          _atribuicao_id: string
          _descricao?: string
          _resultado?: string
          _tipo: string
        }
        Returns: Json
      }
      carteira_relatorio_corretores: {
        Args: { _fim?: string; _inicio?: string }
        Returns: {
          ativas: number
          com_tentativa: number
          contato_estabelecido: number
          corretor_id: string
          corretor_nome: string
          devolvidas: number
          fechamentos: number
          fora_prazo: number
          horas_medias: number
          no_prazo: number
          oportunidades: number
          recebidas: number
          sem_tentativa: number
          transferidas: number
        }[]
      }
      carteira_relatorio_lotes: {
        Args: { _fim?: string; _inicio?: string }
        Returns: {
          com_tentativa: number
          contato_estabelecido: number
          corretor_nome: string
          criado_em: string
          encerradas: number
          fechamentos: number
          lote_id: string
          lote_nome: string
          modo: string
          no_prazo: number
          numero: number
          oportunidades: number
          recebidas: number
          status: string
        }[]
      }
      carteira_relatorio_motivos: {
        Args: { _fim?: string; _inicio?: string }
        Returns: {
          motivo: string
          tipo: string
          total: number
        }[]
      }
      carteira_resolver_solicitacao: {
        Args: {
          _acao: string
          _atribuicao_id: string
          _novo_corretor?: string
          _observacao?: string
        }
        Returns: Json
      }
      carteira_resumo_lotes: {
        Args: never
        Returns: {
          atrasadas: number
          com_oportunidade: number
          contato_estabelecido: number
          corretor_id: string
          criado_em: string
          devolvidas: number
          em_atendimento: number
          lote_id: string
          lote_nome: string
          numero: number
          operacao_id: string
          pendentes: number
          solicitacoes: number
          total: number
          transferidas: number
        }[]
      }
      carteira_selecao_adicionar: {
        Args: { _conta_ids: string[]; _lote_id: string }
        Returns: Json
      }
      carteira_selecao_mover: {
        Args: { _conta_id: string; _lote_destino: string; _operacao_id: string }
        Returns: Json
      }
      carteira_selecao_remover: {
        Args: { _conta_ids: string[]; _operacao_id: string }
        Returns: Json
      }
      carteira_selecao_substituir: {
        Args: {
          _conta_id: string
          _nova_conta_id?: string
          _operacao_id: string
        }
        Returns: Json
      }
      carteira_solicitar: {
        Args: { _atribuicao_id: string; _motivo: string; _tipo: string }
        Returns: Json
      }
      check_duplicate_conta_name: {
        Args: { _name: string }
        Returns: {
          entidade: string
          etapa: string
          id: string
          nome: string
          responsavel_nome: string
        }[]
      }
      check_duplicate_contact: {
        Args: { _email: string; _phone: string }
        Returns: {
          entidade: string
          etapa: string
          id: string
          nome: string
          responsavel_nome: string
        }[]
      }
      conta_tem_captacao: { Args: { _conta_id: string }; Returns: boolean }
      criar_oportunidade_qualificada: {
        Args: { p_chave: string; p_conta_id: string; p_payload: Json }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_site_visits_daily: {
        Args: { days?: number }
        Returns: {
          dia: string
          visitantes_unicos: number
          visitas: number
        }[]
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
      list_contas_min: {
        Args: never
        Returns: {
          id: string
          nome: string
        }[]
      }
      list_leads_min: {
        Args: never
        Returns: {
          id: string
          nome: string
        }[]
      }
      migrar_contas_legadas_oportunidades: {
        Args: never
        Returns: {
          acao: string
          conta_nome: string
          etapa_legada: string
          migrada_conta_id: string
          nova_oportunidade_id: string
        }[]
      }
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
      search_contas_min: {
        Args: { _limit?: number; _q?: string }
        Returns: {
          id: string
          nome: string
        }[]
      }
      unificar_lead_em_conta: {
        Args: { p_conta_id: string; p_lead_id: string }
        Returns: Json
      }
      user_has_menu_override: {
        Args: { _menu_key: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "corretor" | "marketing" | "secretaria"
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
      app_role: ["admin", "gestor", "corretor", "marketing", "secretaria"],
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
