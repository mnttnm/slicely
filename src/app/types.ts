import * as fabric from 'fabric';

export interface PDFMetadata {
  id: string;
  file_name: string;
  file_path: string;
  created_at: string | null;
  updated_at: string | null;
  file_processing_status: string;
  is_template: boolean | null;
  last_processed_at: string | null;
}

export interface ExtractedText {
  id: string;
  pageNumber: number;
  text: string;
  rectangleInfo: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export interface PageAnnotation {
  page: number;            // Page number the annotation applies to
  rectangles: FabricRect[]; // List of rectangle annotations for the page
};

export interface ProcessingRules {
  annotations: PageAnnotation[]; // Array of annotations, grouped by page
  skipped_pages: number[];         // Array of page numbers to skip
};

export type Slicer = {
  id: string;
  user_id: string;    // ID of the user who created the slicer
  name: string;       // Name of the slicer
  description: string | null; // Description of the slicer (optional)
  processing_rules: ProcessingRules; // Processing rules associated with the slicer (optional)
  llm_prompt: string | null; // Prompt for the language model (optional)
  output_mode: string | null; // Mode of output, default is 'text' (optional)
  webhook_url: string | null; // URL for webhook (optional)
};

export type ProcessedOutput = {
  id: string;
  pdf_id: string;
  slicer_id: string;
  page_number: number;
  section_info: SectionInfo;
  text_content: string;
  created_at?: string;
  updated_at?: string;
};


export interface ProcessedOutputWithMetadata extends ProcessedOutput {
  pdfs: {
    file_name: string;
  }
}

export type SectionInfo = {
  type: "llm_output" | "annotation_output" | "full_page";
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

export interface Rectangle {
  top: number;
  left: number;
  width: number;
  height: number;
  id: string;
  fillRule: string;
  flipX: boolean;
  flipY: boolean;
  globalCompositeOperation: string;
  hasBorders: boolean;
  hasControls: boolean;
  hoverCursor: string | null;
  includeDefaultValues: boolean;
  inverted: boolean;
  lockMovementX: boolean;
  lockMovementY: boolean;
  lockRotation: boolean;
  lockScalingFlip: boolean;
  lockScalingX: boolean;
  lockScalingY: boolean;
  // Add any other properties that are present in your rectangles
}

export interface FilterCounts {
  pdf_title: Record<string, number>;
  page_number: Record<string, number>;
}

export interface ActiveFilters {
  pdf_title?: string;
  page_number?: number;
}
