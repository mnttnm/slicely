export interface PDFMetadata {
  id: string;
  name: string;
  url: string;
  uploadDate: Date;
}

export interface RectangleText {
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

export interface Rectangle {
  left: number;     // X-coordinate of the top-left corner
  top: number;      // Y-coordinate of the top-left corner
  width: number;    // Width of the rectangle
  height: number;   // Height of the rectangle
};

export interface PageAnnotation {
  page: number;            // Page number the annotation applies to
  rectangles: Rectangle[]; // List of rectangle annotations for the page
};

export interface ProcessingRules {
  annotations: PageAnnotation[]; // Array of annotations, grouped by page
  skipped_pages: number[];         // Array of page numbers to skip
};

export type Slicer = {
  id: string;
  user_id: string;    // ID of the user who created the slicer
  name: string;       // Name of the slicer
  description?: string; // Description of the slicer (optional)
  processing_rules?: ProcessingRules; // Processing rules associated with the slicer (optional)
  llm_prompt?: string; // Prompt for the language model (optional)
  output_mode?: string; // Mode of output, default is 'text' (optional)
  webhook_url?: string; // URL for webhook (optional)
};

export type ExtractedText = {
  id: string;
  pageNumber: number;
  text: string;
  rectangleInfo: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};
