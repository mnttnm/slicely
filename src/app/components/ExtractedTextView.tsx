import React, { useState } from 'react';
import { ProcessingRules } from '@/app/types';
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import { usePDFViewer } from '@/app/contexts/PDFViewerContext';

interface ExtractedText {
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

interface ExtractedTextViewProps {
  slicedTexts: ExtractedText[];
  processingRules: ProcessingRules | null;
}

const ExtractedTextView: React.FC<ExtractedTextViewProps> = ({ slicedTexts, processingRules }) => {
  const { pageNumber } = usePDFViewer();
  const [showAllPages, setShowAllPages] = useState(false);

  const isPageExcluded = processingRules?.skipped_pages?.includes(pageNumber);

  const filteredTexts = showAllPages
    ? slicedTexts
    : slicedTexts.filter((item) => item.pageNumber === pageNumber);

  const reversedTexts = [...filteredTexts].reverse();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-scroll p-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
        <div className="flex items-center justify-end space-x-2 mb-4">
          <Switch
            id="show-all-pages"
            checked={showAllPages}
            onCheckedChange={setShowAllPages}
            className="scale-75 data-[state=checked]:bg-gray-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=checked]:bg-gray-400 dark:data-[state=unchecked]:bg-gray-700"
          />
          <Label htmlFor="show-all-pages" className="text-xs text-gray-700 dark:text-gray-300">All pages</Label>
        </div>
        <div className="space-y-4">
          {isPageExcluded && !showAllPages ? (
            <p className="text-gray-600 dark:text-gray-400">No content for page (Excluded)</p>
          ) : reversedTexts.length > 0 ? (
              reversedTexts.map((item, index) => (
                <section key={item.id ?? index} className="bg-white dark:bg-gray-700 shadow-sm rounded-lg p-4">
                <h2 className="text-sm font-semibold mb-2">Page: {item.pageNumber}</h2>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <p>Position: (L: {item.rectangleInfo.left.toFixed(2)}, T: {item.rectangleInfo.top.toFixed(2)})</p>
                  <p>Size: {item.rectangleInfo.width.toFixed(2)} x {item.rectangleInfo.height.toFixed(2)}</p>
                  </div>
                  {processingRules?.skipped_pages?.includes(item.pageNumber) ? <p className="text-gray-600 dark:text-gray-400" key={item.id}>Not extracted as page is excluded</p> :
                    <p className="text-sm dark:text-gray-200">{item.text}</p>}
              </section>
            ))
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No annotations for this page</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtractedTextView;
