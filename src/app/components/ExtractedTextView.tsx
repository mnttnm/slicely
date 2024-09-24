import React, { useState } from 'react';
import { ProcessingRules } from '@/app/types';
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import { usePDFViewer } from '@/app/contexts/PDFViewerContext';

interface ExtractedText {
  id: string;
  page_number: number;
  text: string;
  rectangle_info: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

interface ExtractedTextViewProps {
  slicedTexts: ExtractedText[];
  processingRules: ProcessingRules | null;
}

function ExtractedTextView({ slicedTexts, processingRules }: ExtractedTextViewProps) {
  const { pageNumber } = usePDFViewer();
  const [showAllPages, setShowAllPages] = useState(false);

  const isPageExcluded = processingRules?.skipped_pages?.includes(pageNumber);

  const filteredTexts = showAllPages
    ? slicedTexts
    : slicedTexts.filter((item) => item.page_number === pageNumber);

  const reversedTexts = [...filteredTexts].reverse();

  return (
    <div className="flex flex-col h-full p-2 space-y-2">
      <div className="flex items-center justify-end space-x-2">
        <Switch
          id="show-all-pages"
          checked={showAllPages}
          onCheckedChange={setShowAllPages}
        />
        <Label htmlFor="show-all-pages" className="text-sm">All pages</Label>
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {isPageExcluded && !showAllPages ? (
          <p className="text-gray-600 dark:text-gray-400">No content for page (Excluded)</p>
        ) : reversedTexts.length > 0 ? (
          reversedTexts.map((item) => (
            <section key={item.id} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">Page: {item.page_number}</h2>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                <p>Position: (L: {item.rectangle_info.left.toFixed(2)}, T: {item.rectangle_info.top.toFixed(2)})</p>
                <p>Size: {item.rectangle_info.width.toFixed(2)} x {item.rectangle_info.height.toFixed(2)}</p>
              </div>
              {processingRules?.skipped_pages?.includes(item.page_number) ? (
                <p className="text-gray-600 dark:text-gray-400">Not extracted as page is excluded</p>
              ) : (
                  <p className="text-sm text-gray-900 dark:text-gray-200">{item.text}</p>
              )}
            </section>
          ))
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No annotations for this page</p>
        )}
      </div>
    </div>
  );
}

export default ExtractedTextView;
