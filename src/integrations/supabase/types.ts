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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      administradores: {
        Row: {
          created_at: string
          foto_url: string | null
          funcao: string
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          created_at?: string
          foto_url?: string | null
          funcao?: string
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          created_at?: string
          foto_url?: string | null
          funcao?: string
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      cidades_brasil: {
        Row: {
          ativo: boolean
          created_at: string
          id: number
          nome: string
          uf: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: number
          nome: string
          uf: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: number
          nome?: string
          uf?: string
        }
        Relationships: []
      }
      cidades_cobertura: {
        Row: {
          created_at: string
          id: string
          nome: string
          uf: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          uf: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          uf?: string
        }
        Relationships: []
      }
      contas_bancarias: {
        Row: {
          agencia: string
          banco: string
          chave_pix: string | null
          conta: string
          cpf_titular: string
          created_at: string
          id: string
          tipo_conta: string
          titular: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agencia: string
          banco: string
          chave_pix?: string | null
          conta: string
          cpf_titular: string
          created_at?: string
          id?: string
          tipo_conta?: string
          titular: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agencia?: string
          banco?: string
          chave_pix?: string | null
          conta?: string
          cpf_titular?: string
          created_at?: string
          id?: string
          tipo_conta?: string
          titular?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      driver_conquistas: {
        Row: {
          conquistado_em: string
          driver_id: string
          id: string
          marco_key: string
        }
        Insert: {
          conquistado_em?: string
          driver_id: string
          id?: string
          marco_key: string
        }
        Update: {
          conquistado_em?: string
          driver_id?: string
          id?: string
          marco_key?: string
        }
        Relationships: []
      }
      driver_locations: {
        Row: {
          destino_endereco: string | null
          destino_lat: number | null
          destino_lng: number | null
          destino_modo_ativo: boolean | null
          driver_id: string
          id: string
          lat: number
          lng: number
          online: boolean
          updated_at: string
        }
        Insert: {
          destino_endereco?: string | null
          destino_lat?: number | null
          destino_lng?: number | null
          destino_modo_ativo?: boolean | null
          driver_id: string
          id?: string
          lat: number
          lng: number
          online?: boolean
          updated_at?: string
        }
        Update: {
          destino_endereco?: string | null
          destino_lat?: number | null
          destino_lng?: number | null
          destino_modo_ativo?: boolean | null
          driver_id?: string
          id?: string
          lat?: number
          lng?: number
          online?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      envios: {
        Row: {
          cancelado_em: string | null
          coleta_endereco: string
          coleta_lat: number
          coleta_lng: number
          coletado_em: string | null
          created_at: string
          descricao: string
          distancia_km: number | null
          entrega_endereco: string
          entrega_lat: number
          entrega_lng: number
          entregue_em: string | null
          forma_pagamento: string
          id: string
          motorista_id: string | null
          peso_kg: number
          status: string
          tamanho: string
          user_id: string
          valor: number | null
        }
        Insert: {
          cancelado_em?: string | null
          coleta_endereco: string
          coleta_lat: number
          coleta_lng: number
          coletado_em?: string | null
          created_at?: string
          descricao: string
          distancia_km?: number | null
          entrega_endereco: string
          entrega_lat: number
          entrega_lng: number
          entregue_em?: string | null
          forma_pagamento?: string
          id?: string
          motorista_id?: string | null
          peso_kg?: number
          status?: string
          tamanho?: string
          user_id: string
          valor?: number | null
        }
        Update: {
          cancelado_em?: string | null
          coleta_endereco?: string
          coleta_lat?: number
          coleta_lng?: number
          coletado_em?: string | null
          created_at?: string
          descricao?: string
          distancia_km?: number | null
          entrega_endereco?: string
          entrega_lat?: number
          entrega_lng?: number
          entregue_em?: string | null
          forma_pagamento?: string
          id?: string
          motorista_id?: string | null
          peso_kg?: number
          status?: string
          tamanho?: string
          user_id?: string
          valor?: number | null
        }
        Relationships: []
      }
      indicacoes: {
        Row: {
          bonus_valor: number
          created_at: string
          id: string
          referred_email: string
          referred_user_id: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          bonus_valor?: number
          created_at?: string
          id?: string
          referred_email: string
          referred_user_id?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          bonus_valor?: number
          created_at?: string
          id?: string
          referred_email?: string
          referred_user_id?: string | null
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      metodos_pagamento: {
        Row: {
          created_at: string
          dados: Json
          id: string
          label: string
          padrao: boolean
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dados?: Json
          id?: string
          label: string
          padrao?: boolean
          tipo?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dados?: Json
          id?: string
          label?: string
          padrao?: boolean
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          mensagem: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem: string
          tipo?: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      precificacao: {
        Row: {
          ativo: boolean
          categoria: string
          cidade_id: string
          created_at: string
          dias_semana: number[]
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          multiplicador: number
          preco_base: number
          preco_km: number
          preco_minuto: number
          taxa_minima: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          cidade_id: string
          created_at?: string
          dias_semana?: number[]
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          multiplicador?: number
          preco_base?: number
          preco_km?: number
          preco_minuto?: number
          taxa_minima?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          cidade_id?: string
          created_at?: string
          dias_semana?: number[]
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          multiplicador?: number
          preco_base?: number
          preco_km?: number
          preco_minuto?: number
          taxa_minima?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "precificacao_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades_cobertura"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cnh: string | null
          codigo_indicacao: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          endereco: string | null
          id: string
          nome: string | null
          onboarding_completo: boolean
          status_aprovacao: string
          stripe_customer_id: string | null
          telefone: string | null
          tipo: string
          updated_at: string
          veiculo_cor: string | null
          veiculo_modelo: string | null
          veiculo_placa: string | null
          verificacao_facial: boolean
        }
        Insert: {
          avatar_url?: string | null
          cnh?: string | null
          codigo_indicacao?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          endereco?: string | null
          id: string
          nome?: string | null
          onboarding_completo?: boolean
          status_aprovacao?: string
          stripe_customer_id?: string | null
          telefone?: string | null
          tipo?: string
          updated_at?: string
          veiculo_cor?: string | null
          veiculo_modelo?: string | null
          veiculo_placa?: string | null
          verificacao_facial?: boolean
        }
        Update: {
          avatar_url?: string | null
          cnh?: string | null
          codigo_indicacao?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          endereco?: string | null
          id?: string
          nome?: string | null
          onboarding_completo?: boolean
          status_aprovacao?: string
          stripe_customer_id?: string | null
          telefone?: string | null
          tipo?: string
          updated_at?: string
          veiculo_cor?: string | null
          veiculo_modelo?: string | null
          veiculo_placa?: string | null
          verificacao_facial?: boolean
        }
        Relationships: []
      }
      ratings: {
        Row: {
          avaliado_id: string
          avaliador_id: string
          comentario: string | null
          created_at: string
          id: string
          nota: number
          ride_id: string
        }
        Insert: {
          avaliado_id: string
          avaliador_id: string
          comentario?: string | null
          created_at?: string
          id?: string
          nota: number
          ride_id: string
        }
        Update: {
          avaliado_id?: string
          avaliador_id?: string
          comentario?: string | null
          created_at?: string
          id?: string
          nota?: number
          ride_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          ride_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          ride_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          ride_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_messages_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_splits: {
        Row: {
          convidado_email: string
          convidado_user_id: string | null
          created_at: string
          id: string
          percentual: number
          ride_id: string
          status: string
        }
        Insert: {
          convidado_email: string
          convidado_user_id?: string | null
          created_at?: string
          id?: string
          percentual?: number
          ride_id: string
          status?: string
        }
        Update: {
          convidado_email?: string
          convidado_user_id?: string | null
          created_at?: string
          id?: string
          percentual?: number
          ride_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_splits_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_stops: {
        Row: {
          chegou_em: string | null
          created_at: string
          endereco: string
          id: string
          lat: number
          lng: number
          ordem: number
          ride_id: string
        }
        Insert: {
          chegou_em?: string | null
          created_at?: string
          endereco: string
          id?: string
          lat: number
          lng: number
          ordem?: number
          ride_id: string
        }
        Update: {
          chegou_em?: string | null
          created_at?: string
          endereco?: string
          id?: string
          lat?: number
          lng?: number
          ordem?: number
          ride_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_stops_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          aceita_em: string | null
          agendada_para: string | null
          cancelada_em: string | null
          cancelado_por: string | null
          categoria: string
          chegou_em: string | null
          compartilhar_token: string | null
          created_at: string
          destino_endereco: string
          destino_lat: number
          destino_lng: number
          dispatched_at: string | null
          distancia_km: number | null
          duracao_min: number | null
          duracao_real_min: number | null
          finalizada_em: string | null
          forma_pagamento: string
          gorjeta: number | null
          id: string
          iniciada_em: string | null
          km_real: number | null
          motivo_cancelamento: string | null
          motorista_id: string | null
          motorista_tentativas: string[] | null
          origem_endereco: string
          origem_lat: number
          origem_lng: number
          passageiro_id: string
          payment_intent_id: string | null
          payment_status: string | null
          status: string
          stripe_payment_method_id: string | null
          taxa_noshow: number | null
          valor: number | null
          valor_final: number | null
        }
        Insert: {
          aceita_em?: string | null
          agendada_para?: string | null
          cancelada_em?: string | null
          cancelado_por?: string | null
          categoria?: string
          chegou_em?: string | null
          compartilhar_token?: string | null
          created_at?: string
          destino_endereco: string
          destino_lat: number
          destino_lng: number
          dispatched_at?: string | null
          distancia_km?: number | null
          duracao_min?: number | null
          duracao_real_min?: number | null
          finalizada_em?: string | null
          forma_pagamento?: string
          gorjeta?: number | null
          id?: string
          iniciada_em?: string | null
          km_real?: number | null
          motivo_cancelamento?: string | null
          motorista_id?: string | null
          motorista_tentativas?: string[] | null
          origem_endereco: string
          origem_lat: number
          origem_lng: number
          passageiro_id: string
          payment_intent_id?: string | null
          payment_status?: string | null
          status?: string
          stripe_payment_method_id?: string | null
          taxa_noshow?: number | null
          valor?: number | null
          valor_final?: number | null
        }
        Update: {
          aceita_em?: string | null
          agendada_para?: string | null
          cancelada_em?: string | null
          cancelado_por?: string | null
          categoria?: string
          chegou_em?: string | null
          compartilhar_token?: string | null
          created_at?: string
          destino_endereco?: string
          destino_lat?: number
          destino_lng?: number
          dispatched_at?: string | null
          distancia_km?: number | null
          duracao_min?: number | null
          duracao_real_min?: number | null
          finalizada_em?: string | null
          forma_pagamento?: string
          gorjeta?: number | null
          id?: string
          iniciada_em?: string | null
          km_real?: number | null
          motivo_cancelamento?: string | null
          motorista_id?: string | null
          motorista_tentativas?: string[] | null
          origem_endereco?: string
          origem_lat?: number
          origem_lng?: number
          passageiro_id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          status?: string
          stripe_payment_method_id?: string | null
          taxa_noshow?: number | null
          valor?: number | null
          valor_final?: number | null
        }
        Relationships: []
      }
      rotas_salvas: {
        Row: {
          destino_endereco: string
          destino_lat: number
          destino_lng: number
          id: string
          origem_endereco: string
          origem_lat: number
          origem_lng: number
          usado_em: string
          user_id: string
          vezes_usado: number
        }
        Insert: {
          destino_endereco: string
          destino_lat: number
          destino_lng: number
          id?: string
          origem_endereco: string
          origem_lat: number
          origem_lng: number
          usado_em?: string
          user_id: string
          vezes_usado?: number
        }
        Update: {
          destino_endereco?: string
          destino_lat?: number
          destino_lng?: number
          id?: string
          origem_endereco?: string
          origem_lat?: number
          origem_lng?: number
          usado_em?: string
          user_id?: string
          vezes_usado?: number
        }
        Relationships: []
      }
      saques: {
        Row: {
          conta_bancaria_id: string | null
          created_at: string
          id: string
          processado_em: string | null
          status: string
          user_id: string
          valor: number
        }
        Insert: {
          conta_bancaria_id?: string | null
          created_at?: string
          id?: string
          processado_em?: string | null
          status?: string
          user_id: string
          valor: number
        }
        Update: {
          conta_bancaria_id?: string | null
          created_at?: string
          id?: string
          processado_em?: string | null
          status?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "saques_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
        ]
      }
      verificacao_selfie: {
        Row: {
          driver_id: string
          foto_url: string | null
          id: string
          respondido_em: string | null
          resultado: string | null
          solicitado_em: string
          status: string
        }
        Insert: {
          driver_id: string
          foto_url?: string | null
          id?: string
          respondido_em?: string | null
          resultado?: string | null
          solicitado_em?: string
          status?: string
        }
        Update: {
          driver_id?: string
          foto_url?: string | null
          id?: string
          respondido_em?: string | null
          resultado?: string | null
          solicitado_em?: string
          status?: string
        }
        Relationships: []
      }
      voucher_usos: {
        Row: {
          created_at: string
          id: string
          ride_id: string
          user_id: string
          valor: number
          voucher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ride_id: string
          user_id: string
          valor: number
          voucher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ride_id?: string
          user_id?: string
          valor?: number
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_usos_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_usos_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers_corporativos"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers_corporativos: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          empresa_nome: string
          id: string
          validade: string | null
          valor_limite: number
          valor_usado: number
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          empresa_nome: string
          id?: string
          validade?: string | null
          valor_limite?: number
          valor_usado?: number
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          empresa_nome?: string
          id?: string
          validade?: string | null
          valor_limite?: number
          valor_usado?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_redispatch: { Args: { p_ride_id: string }; Returns: string }
      dispatch_ride: { Args: { p_ride_id: string }; Returns: string }
      find_nearest_driver: {
        Args: { p_exclude?: string[]; p_lat: number; p_lng: number }
        Returns: string
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
