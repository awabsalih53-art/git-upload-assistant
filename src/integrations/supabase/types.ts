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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      inventory: {
        Row: {
          brand: string | null
          category: string | null
          condition: string | null
          created_at: string | null
          date_listed: string | null
          date_purchased: string | null
          date_sold: string | null
          fees_estimate: number | null
          id: string
          item_name: string
          listing_status: string | null
          notes: string | null
          photos: string[] | null
          platforms: string[] | null
          profit: number | null
          purchase_price: number | null
          roi_percent: number | null
          sale_price: number | null
          shipping_cost: number | null
          shipping_paid_by: string | null
          size: string | null
          sku: string
          storage_location: string | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string | null
          date_listed?: string | null
          date_purchased?: string | null
          date_sold?: string | null
          fees_estimate?: number | null
          id?: string
          item_name: string
          listing_status?: string | null
          notes?: string | null
          photos?: string[] | null
          platforms?: string[] | null
          profit?: number | null
          purchase_price?: number | null
          roi_percent?: number | null
          sale_price?: number | null
          shipping_cost?: number | null
          shipping_paid_by?: string | null
          size?: string | null
          sku: string
          storage_location?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string | null
          date_listed?: string | null
          date_purchased?: string | null
          date_sold?: string | null
          fees_estimate?: number | null
          id?: string
          item_name?: string
          listing_status?: string | null
          notes?: string | null
          photos?: string[] | null
          platforms?: string[] | null
          profit?: number | null
          purchase_price?: number | null
          roi_percent?: number | null
          sale_price?: number | null
          shipping_cost?: number | null
          shipping_paid_by?: string | null
          size?: string | null
          sku?: string
          storage_location?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      returns: {
        Row: {
          actual_loss: number | null
          created_at: string | null
          date_closed: string | null
          date_opened: string
          expected_loss: number | null
          id: string
          notes: string | null
          order_id: string | null
          reason: string | null
          resolution: string | null
          sale_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_loss?: number | null
          created_at?: string | null
          date_closed?: string | null
          date_opened: string
          expected_loss?: number | null
          id?: string
          notes?: string | null
          order_id?: string | null
          reason?: string | null
          resolution?: string | null
          sale_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_loss?: number | null
          created_at?: string | null
          date_closed?: string | null
          date_opened?: string
          expected_loss?: number | null
          id?: string
          notes?: string | null
          order_id?: string | null
          reason?: string | null
          resolution?: string | null
          sale_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          buyer_address: string | null
          buyer_name: string | null
          buyer_paid_shipping: boolean | null
          created_at: string | null
          date_shipped: string | null
          date_sold: string
          id: string
          inventory_id: string | null
          item_name: string
          net_profit: number | null
          notes: string | null
          order_id: string
          payment_processing_fees: number | null
          payout_date: string | null
          payout_status: string | null
          platform: string
          platform_fees: number | null
          sale_price: number
          shipping_cost: number | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_address?: string | null
          buyer_name?: string | null
          buyer_paid_shipping?: boolean | null
          created_at?: string | null
          date_shipped?: string | null
          date_sold: string
          id?: string
          inventory_id?: string | null
          item_name: string
          net_profit?: number | null
          notes?: string | null
          order_id: string
          payment_processing_fees?: number | null
          payout_date?: string | null
          payout_status?: string | null
          platform: string
          platform_fees?: number | null
          sale_price: number
          shipping_cost?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_address?: string | null
          buyer_name?: string | null
          buyer_paid_shipping?: boolean | null
          created_at?: string | null
          date_shipped?: string | null
          date_sold?: string
          id?: string
          inventory_id?: string | null
          item_name?: string
          net_profit?: number | null
          notes?: string | null
          order_id?: string
          payment_processing_fees?: number | null
          payout_date?: string | null
          payout_status?: string | null
          platform?: string
          platform_fees?: number | null
          sale_price?: number
          shipping_cost?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          carrier: string | null
          created_at: string | null
          delivered_date: string | null
          dispatch_deadline: string | null
          id: string
          label_cost: number | null
          notes: string | null
          sale_id: string | null
          shipped_date: string | null
          status: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string | null
          delivered_date?: string | null
          dispatch_deadline?: string | null
          id?: string
          label_cost?: number | null
          notes?: string | null
          sale_id?: string | null
          shipped_date?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string | null
          delivered_date?: string | null
          dispatch_deadline?: string | null
          id?: string
          label_cost?: number | null
          notes?: string | null
          sale_id?: string | null
          shipped_date?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string | null
          completed_date: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          related_inventory_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_inventory_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_inventory_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_related_inventory_id_fkey"
            columns: ["related_inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
