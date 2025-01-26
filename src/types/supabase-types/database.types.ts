export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      outputs: {
        Row: {
          created_at: string | null
          embedding: string | null
          id: string
          is_seeded_data: boolean
          page_number: number
          pdf_id: string
          section_info: Json
          slicer_id: string
          text_content: string
          tsv: unknown | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_seeded_data?: boolean
          page_number: number
          pdf_id: string
          section_info: Json
          slicer_id: string
          text_content: string
          tsv?: unknown | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_seeded_data?: boolean
          page_number?: number
          pdf_id?: string
          section_info?: Json
          slicer_id?: string
          text_content?: string
          tsv?: unknown | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outputs_pdf_id_fkey"
            columns: ["pdf_id"]
            isOneToOne: false
            referencedRelation: "pdfs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outputs_slicer_id_fkey"
            columns: ["slicer_id"]
            isOneToOne: false
            referencedRelation: "slicers"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_llm_outputs: {
        Row: {
          created_at: string | null
          id: string
          is_seeded_data: boolean | null
          output: Json
          pdf_id: string
          prompt: string
          prompt_id: string
          slicer_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_seeded_data?: boolean | null
          output: Json
          pdf_id: string
          prompt: string
          prompt_id: string
          slicer_id: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_seeded_data?: boolean | null
          output?: Json
          pdf_id?: string
          prompt?: string
          prompt_id?: string
          slicer_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_llm_outputs_pdf_id_fkey"
            columns: ["pdf_id"]
            isOneToOne: false
            referencedRelation: "pdfs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_llm_outputs_slicer_id_fkey"
            columns: ["slicer_id"]
            isOneToOne: false
            referencedRelation: "slicers"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_slicers: {
        Row: {
          id: string
          is_seeded_data: boolean | null
          pdf_id: string
          slicer_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_seeded_data?: boolean | null
          pdf_id: string
          slicer_id: string
          user_id?: string
        }
        Update: {
          id?: string
          is_seeded_data?: boolean | null
          pdf_id?: string
          slicer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_slicers_pdf_id_fkey"
            columns: ["pdf_id"]
            isOneToOne: false
            referencedRelation: "pdfs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_slicers_slicer_id_fkey"
            columns: ["slicer_id"]
            isOneToOne: false
            referencedRelation: "slicers"
            referencedColumns: ["id"]
          },
        ]
      }
      pdfs: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_processing_status: string
          id: string
          is_seeded_data: boolean | null
          is_template: boolean | null
          last_processed_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_processing_status?: string
          id?: string
          is_seeded_data?: boolean | null
          is_template?: boolean | null
          last_processed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_processing_status?: string
          id?: string
          is_seeded_data?: boolean | null
          is_template?: boolean | null
          last_processed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      slicer_llm_outputs: {
        Row: {
          created_at: string | null
          id: string
          is_seeded_data: boolean | null
          output: Json
          prompt: string
          prompt_id: string
          slicer_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_seeded_data?: boolean | null
          output: Json
          prompt: string
          prompt_id: string
          slicer_id: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_seeded_data?: boolean | null
          output?: Json
          prompt?: string
          prompt_id?: string
          slicer_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slicer_llm_outputs_slicer_id_fkey"
            columns: ["slicer_id"]
            isOneToOne: false
            referencedRelation: "slicers"
            referencedColumns: ["id"]
          },
        ]
      }
      slicers: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_seeded_data: boolean | null
          llm_prompts: Json | null
          name: string
          output_mode: string | null
          pdf_password: string | null
          pdf_prompts: Json | null
          processing_rules: Json | null
          updated_at: string | null
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_seeded_data?: boolean | null
          llm_prompts?: Json | null
          name: string
          output_mode?: string | null
          pdf_password?: string | null
          pdf_prompts?: Json | null
          processing_rules?: Json | null
          updated_at?: string | null
          user_id?: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_seeded_data?: boolean | null
          llm_prompts?: Json | null
          name?: string
          output_mode?: string | null
          pdf_password?: string | null
          pdf_prompts?: Json | null
          processing_rules?: Json | null
          updated_at?: string | null
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      get_context: {
        Args: {
          query_embedding: string
          p_slicer_id: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          pdf_id: string
          slicer_id: string
          created_at: string
          updated_at: string
          page_number: number
          section_info: Json
          text_content: string
          similarity: number
        }[]
      }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_outputs: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          p_slicer_id: string
        }
        Returns: {
          id: string
          pdf_id: string
          slicer_id: string
          created_at: string
          updated_at: string
          page_number: number
          section_info: Json
          text_content: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

