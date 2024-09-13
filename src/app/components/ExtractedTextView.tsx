import React from 'react';
import { useSlicerControl } from '@/app/contexts/SlicerControlContext';
import { ProcessingRules } from '@/app/types';

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
  const { pageNumber } = useSlicerControl();

  const isPageExcluded = processingRules?.skipped_pages?.includes(pageNumber);
  const pageAnnotations = processingRules?.annotations.find(
    (annotation) => annotation.page === pageNumber
  );

  return (
    <section className="flex flex-col max-h-screen overflow-hidden">
      <div className="overflow-y-auto flex-grow">
        {isPageExcluded ? (
          <p className="text-gray-600 dark:text-gray-400">No content for page (Excluded)</p>
        ) : pageAnnotations ? (
          slicedTexts
            .filter((item) => item.pageNumber === pageNumber)
            .map((item) => (
              <section key={item.id} className="mb-4 p-4 border border-gray-300 dark:border-gray-700 rounded">
                <h2>Page: {item.pageNumber}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Position: (L: {item.rectangleInfo.left.toFixed(2)}, T: {item.rectangleInfo.top.toFixed(2)})
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Size: {item.rectangleInfo.width.toFixed(2)} x {item.rectangleInfo.height.toFixed(2)}
                </p>
                <p className="mt-2 dark:text-gray-200">{item.text}</p>
              </section>
            ))
        ) : (
              <p className="text-gray-600 dark:text-gray-400">No annotations for this page</p>
        )}
      </div>
    </section>
  );
};

export default ExtractedTextView;
