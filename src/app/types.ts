import * as fabric from 'fabric';

export interface PDFMetadata {
  id: string;
  name: string;
  url: string;
  uploadDate: Date;
  status: "uploaded" | "processing" | "processed" | "error";
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

// export interface Rectangle {
//   id: string;
//   left: number;     // X-coordinate of the top-left corner
//   top: number;      // Y-coordinate of the top-left corner
//   width: number;    // Width of the rectangle
//   height: number;   // Height of the rectangle
// };

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

export type LLMOutput = {
  prompt: string;
  output: string;
};

export type ProcessedPageOutput = {
  pageNumber: number;
  rawPageContent: string;
  extractedSectionTexts: ExtractedText[];
  llmOutputs: LLMOutput[];
};


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






