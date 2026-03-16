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
      driver_locations: {
        Row: {
          driver_id: string
          id: string
          lat: number
          lng: number
          online: boolean
          updated_at: string
        }
        Insert: {
          driver_id: string
          id?: string
          lat: number
          lng: number
          online?: boolean
          updated_at?: string
        }
        Update: {
          driver_id?: string
          id?: string
          lat?: number
          lng?: number
          online?: boolean
          updated_at?: string
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
      precificacao: {
        Row: {
          ativo: boolean
          categoria: string
          cidade_id: string
          created_at: string
          id: string
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
          id?: string
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
          id?: string
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
          cpf: string | null
          created_at: string
          id: string
          nome: string | null
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
          cpf?: string | null
          created_at?: string
          id: string
          nome?: string | null
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
          cpf?: string | null
          created_at?: string
          id?: string
          nome?: string | null
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
      rides: {
        Row: {
          aceita_em: string | null
          cancelada_em: string | null
          categoria: string
          created_at: string
          destino_endereco: string
          destino_lat: number
          destino_lng: number
          dispatched_at: string | null
          distancia_km: number | null
          duracao_min: number | null
          finalizada_em: string | null
          forma_pagamento: string
          id: string
          iniciada_em: string | null
          motorista_id: string | null
          motorista_tentativas: string[] | null
          origem_endereco: string
          origem_lat: number
          origem_lng: number
          passageiro_id: string
          status: string
          valor: number | null
        }
        Insert: {
          aceita_em?: string | null
          cancelada_em?: string | null
          categoria?: string
          created_at?: string
          destino_endereco: string
          destino_lat: number
          destino_lng: number
          dispatched_at?: string | null
          distancia_km?: number | null
          duracao_min?: number | null
          finalizada_em?: string | null
          forma_pagamento?: string
          id?: string
          iniciada_em?: string | null
          motorista_id?: string | null
          motorista_tentativas?: string[] | null
          origem_endereco: string
          origem_lat: number
          origem_lng: number
          passageiro_id: string
          status?: string
          valor?: number | null
        }
        Update: {
          aceita_em?: string | null
          cancelada_em?: string | null
          categoria?: string
          created_at?: string
          destino_endereco?: string
          destino_lat?: number
          destino_lng?: number
          dispatched_at?: string | null
          distancia_km?: number | null
          duracao_min?: number | null
          finalizada_em?: string | null
          forma_pagamento?: string
          id?: string
          iniciada_em?: string | null
          motorista_id?: string | null
          motorista_tentativas?: string[] | null
          origem_endereco?: string
          origem_lat?: number
          origem_lng?: number
          passageiro_id?: string
          status?: string
          valor?: number | null
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
