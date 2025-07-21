export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      asset_holdings: {
        Row: {
          asset_id: string
          balance: number | null
          id: string
          last_updated: string | null
          locked_balance: number | null
          user_id: string
        }
        Insert: {
          asset_id: string
          balance?: number | null
          id?: string
          last_updated?: string | null
          locked_balance?: number | null
          user_id: string
        }
        Update: {
          asset_id?: string
          balance?: number | null
          id?: string
          last_updated?: string | null
          locked_balance?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_holdings_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "tokenized_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["compliance_risk"]
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: Database["public"]["Enums"]["compliance_risk"]
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["compliance_risk"]
          user_id?: string | null
        }
        Relationships: []
      }
      kyc_verification: {
        Row: {
          created_at: string | null
          document_number: string | null
          document_type: string
          expiry_date: string | null
          id: string
          metadata: Json | null
          risk_score: number | null
          updated_at: string | null
          user_id: string
          verification_date: string | null
          verification_status: Database["public"]["Enums"]["kyc_status"] | null
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          document_type: string
          expiry_date?: string | null
          id?: string
          metadata?: Json | null
          risk_score?: number | null
          updated_at?: string | null
          user_id: string
          verification_date?: string | null
          verification_status?: Database["public"]["Enums"]["kyc_status"] | null
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          document_type?: string
          expiry_date?: string | null
          id?: string
          metadata?: Json | null
          risk_score?: number | null
          updated_at?: string | null
          user_id?: string
          verification_date?: string | null
          verification_status?: Database["public"]["Enums"]["kyc_status"] | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          asset_id: string
          created_at: string | null
          expires_at: string | null
          filled_quantity: number | null
          id: string
          order_type: Database["public"]["Enums"]["order_type"]
          price: number | null
          quantity: number
          remaining_quantity: number | null
          side: Database["public"]["Enums"]["order_side"]
          status: Database["public"]["Enums"]["order_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          expires_at?: string | null
          filled_quantity?: number | null
          id?: string
          order_type: Database["public"]["Enums"]["order_type"]
          price?: number | null
          quantity: number
          remaining_quantity?: number | null
          side: Database["public"]["Enums"]["order_side"]
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          expires_at?: string | null
          filled_quantity?: number | null
          id?: string
          order_type?: Database["public"]["Enums"]["order_type"]
          price?: number | null
          quantity?: number
          remaining_quantity?: number | null
          side?: Database["public"]["Enums"]["order_side"]
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "tokenized_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          compliance_risk: Database["public"]["Enums"]["compliance_risk"] | null
          created_at: string | null
          device_fingerprint: string | null
          email: string
          first_name: string | null
          id: string
          ip_whitelist: string[] | null
          jurisdiction: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"] | null
          last_login_at: string | null
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          compliance_risk?:
            | Database["public"]["Enums"]["compliance_risk"]
            | null
          created_at?: string | null
          device_fingerprint?: string | null
          email: string
          first_name?: string | null
          id?: string
          ip_whitelist?: string[] | null
          jurisdiction?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          last_login_at?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          compliance_risk?:
            | Database["public"]["Enums"]["compliance_risk"]
            | null
          created_at?: string | null
          device_fingerprint?: string | null
          email?: string
          first_name?: string | null
          id?: string
          ip_whitelist?: string[] | null
          jurisdiction?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          last_login_at?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      strategy_signals: {
        Row: {
          asset_id: string
          confidence: number | null
          created_at: string | null
          executed: boolean | null
          id: string
          price_target: number | null
          risk_assessment: Json | null
          signal_type: string
          strategy_id: string
        }
        Insert: {
          asset_id: string
          confidence?: number | null
          created_at?: string | null
          executed?: boolean | null
          id?: string
          price_target?: number | null
          risk_assessment?: Json | null
          signal_type: string
          strategy_id: string
        }
        Update: {
          asset_id?: string
          confidence?: number | null
          created_at?: string | null
          executed?: boolean | null
          id?: string
          price_target?: number | null
          risk_assessment?: Json | null
          signal_type?: string
          strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_signals_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "tokenized_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_signals_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "trading_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tokenization_events: {
        Row: {
          amount: number
          asset_issuer: string | null
          asset_symbol: string
          compliance_metadata: Json | null
          created_at: string | null
          event_type: string
          id: string
          iso20022_data: Json | null
          user_id: string
          xrpl_ledger_index: number | null
          xrpl_transaction_hash: string | null
        }
        Insert: {
          amount: number
          asset_issuer?: string | null
          asset_symbol: string
          compliance_metadata?: Json | null
          created_at?: string | null
          event_type: string
          id?: string
          iso20022_data?: Json | null
          user_id: string
          xrpl_ledger_index?: number | null
          xrpl_transaction_hash?: string | null
        }
        Update: {
          amount?: number
          asset_issuer?: string | null
          asset_symbol?: string
          compliance_metadata?: Json | null
          created_at?: string | null
          event_type?: string
          id?: string
          iso20022_data?: Json | null
          user_id?: string
          xrpl_ledger_index?: number | null
          xrpl_transaction_hash?: string | null
        }
        Relationships: []
      }
      tokenized_assets: {
        Row: {
          asset_name: string
          asset_symbol: string
          circulating_supply: number | null
          compliance_data: Json | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          total_supply: number
          updated_at: string | null
          xrpl_currency_code: string | null
          xrpl_issuer_address: string | null
        }
        Insert: {
          asset_name: string
          asset_symbol: string
          circulating_supply?: number | null
          compliance_data?: Json | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          total_supply: number
          updated_at?: string | null
          xrpl_currency_code?: string | null
          xrpl_issuer_address?: string | null
        }
        Update: {
          asset_name?: string
          asset_symbol?: string
          circulating_supply?: number | null
          compliance_data?: Json | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          total_supply?: number
          updated_at?: string | null
          xrpl_currency_code?: string | null
          xrpl_issuer_address?: string | null
        }
        Relationships: []
      }
      trade_executions: {
        Row: {
          asset_symbol: string
          buyer_id: string
          compliance_flags: string[] | null
          created_at: string | null
          execution_time: string | null
          id: string
          order_id: string | null
          price: number
          quantity: number
          seller_id: string
          settlement_status: string | null
          total_value: number
          xrpl_transaction_hash: string | null
        }
        Insert: {
          asset_symbol: string
          buyer_id: string
          compliance_flags?: string[] | null
          created_at?: string | null
          execution_time?: string | null
          id?: string
          order_id?: string | null
          price: number
          quantity: number
          seller_id: string
          settlement_status?: string | null
          total_value: number
          xrpl_transaction_hash?: string | null
        }
        Update: {
          asset_symbol?: string
          buyer_id?: string
          compliance_flags?: string[] | null
          created_at?: string | null
          execution_time?: string | null
          id?: string
          order_id?: string | null
          price?: number
          quantity?: number
          seller_id?: string
          settlement_status?: string | null
          total_value?: number
          xrpl_transaction_hash?: string | null
        }
        Relationships: []
      }
      trading_strategies: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          parameters: Json
          performance_metrics: Json | null
          strategy_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          parameters: Json
          performance_metrics?: Json | null
          strategy_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          parameters?: Json
          performance_metrics?: Json | null
          strategy_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_behavior_log: {
        Row: {
          action: string
          created_at: string | null
          device_fingerprint: string | null
          id: string
          ip_address: unknown | null
          location_data: Json | null
          risk_indicators: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_address?: unknown | null
          location_data?: Json | null
          risk_indicators?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_address?: unknown | null
          location_data?: Json | null
          risk_indicators?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      XRPL: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      compliance_risk: "low" | "medium" | "high" | "critical"
      kyc_status: "pending" | "approved" | "rejected" | "expired"
      order_side: "buy" | "sell"
      order_status: "pending" | "partial" | "filled" | "cancelled" | "expired"
      order_type: "market" | "limit" | "stop_loss" | "take_profit"
      subscription_tier: "free" | "standard" | "enterprise"
      user_role: "admin" | "premium" | "basic" | "compliance"
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
      compliance_risk: ["low", "medium", "high", "critical"],
      kyc_status: ["pending", "approved", "rejected", "expired"],
      order_side: ["buy", "sell"],
      order_status: ["pending", "partial", "filled", "cancelled", "expired"],
      order_type: ["market", "limit", "stop_loss", "take_profit"],
      subscription_tier: ["free", "standard", "enterprise"],
      user_role: ["admin", "premium", "basic", "compliance"],
    },
  },
} as const
