/**
 * OCR Module Exports
 *
 * Multi-method OCR service with smart routing.
 */

// Types
export * from './types';

// OCR Service functions
export {
  extractText,
  getLLMWhispererQuota,
  simpleExtract,
  extractWithLayout,
  extractForms,
} from './ocr-service';
