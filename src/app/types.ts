import { FormattedResponse, LLMResponse } from "@/lib/openai";
import { Tables } from "@/types/supabase-types/database.types";
import { ContextObject } from "@/utils/explore-utils";
import * as fabric from "fabric";

export interface PDFMetadata {
  id: string;
  file_name: string;
  file_path: string;
  created_at: string | null;
  updated_at: string | null;
  file_processing_status: string;
  is_template: boolean | null;
  last_processed_at: string | null;
  password?: string;
}

export interface ExtractedText {
  id: string;
  page_number: number;  // Changed from pageNumber
  text: string;
  rectangle_info: {     // Changed from rectangleInfo
    left: number;
    top: number;
    width: number;
    height: number;
  } | null;
}

export interface PageAnnotation {
  page: number;            // Page number the annotation applies to
  rectangles: Partial<FabricRect>[]; // List of rectangle annotations for the page
};

export interface ProcessingRules {
  annotations: PageAnnotation[];
  pageSelection: {
    strategy: "include" | "exclude";
    rules: PageSelectionRule[];
  };
}

export interface LLMPrompt {
  id: string;
  prompt: string;
}

export interface Slicer {
  id: string;
  user_id: string;    // ID of the user who created the slicer
  name: string;       // Name of the slicer
  description: string | null; // Description of the slicer (optional)
  processing_rules: ProcessingRules; // Processing rules associated with the slicer (optional)
  llm_prompts: LLMPrompt[]; // Changed from llm_prompt to llm_prompts
  output_mode: string | null; // Mode of output, default is 'text' (optional)
  webhook_url: string | null; // URL for webhook (optional)
  pdf_password: string | null; // Changed from 'password' to 'pdf_password'
  created_at: string | null;
  updated_at: string | null;
  pdf_prompts: LLMPrompt[]; // New property for individual PDF prompts
  is_seeded_data?: boolean;
}

export type SlicedPdfContent = {
  id: string;
  pdf_id: string;
  slicer_id: string;
  page_number: number;
  section_info: SectionInfo;
  text_content: string;
  created_at?: string;
  updated_at?: string;
  tsv: unknown;
  embeddings?: number[];
};

export interface SlicedPdfContentWithMetadata extends SlicedPdfContent {
  pdfs: {
    file_name: string | null;
  }
}

export type SectionInfo = {
  type: "llm_output" | "annotation_output" | "full_page_output";
  metadata: {
    [key: string]: any;
  };
}

export interface FabricRect extends fabric.Rect {
  id: string;
}

export interface ExtractedTextItem {
  str: string;
  transform: number[];
}

export interface FilterCounts {
  pdf_title: Record<string, number>;
  page_number: Record<string, number>;
}

export interface ActiveFilters {
  pdf_title?: string;
  page_number?: number;
}

export interface SlicerLLMOutput {
  id: string;
  prompt_id: string;
  prompt: string;
  output: LLMResponse;
}

export type PageSelectionRule =
  | { type: "all" }
  | { type: "range"; start: number; end: number }
  | { type: "specific"; pages: number[] };

export interface PdfLLMOutput {
  id: string;
  pdf_id: string;
  slicer_id: string;
  prompt_id: string;
  prompt: string;
  output: LLMResponse;
}

export interface ChatMessage {
  role: string;
  content: string | JSX.Element;
  rawContent?: {
    response_type: string;
    content: FormattedResponse;
    raw_response: string;
    confidence: number;
    follow_up_questions: string[];
  };
  contextObjects?: ContextObject[];
}


export type OutputType = Omit<Tables<"outputs">, "user_id">;
