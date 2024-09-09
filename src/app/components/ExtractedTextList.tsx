import React, { useEffect } from 'react';
import { usePDFViewer } from '../contexts/PDFViewerContext';
import { getPageText } from '@/app/utils/pdfUtils';

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

interface ExtractedTextListProps {
  extractedTexts: ExtractedText[];
}

const ExtractedTextList: React.FC<ExtractedTextListProps> = ({ extractedTexts }) => {
  const { pageNumber, slicer, pdfDocument } = usePDFViewer();
  const [currentPageContent, setCurrentPageContent] = React.useState<string | null>(null);

  useEffect(() => {
    const fetchPageContent = async () => {
      if (pdfDocument && pageNumber) {
        const content = await getPageText(pdfDocument, pageNumber);
        setCurrentPageContent(content);
      }
    };
    fetchPageContent();
  }, [pdfDocument, pageNumber]);

  const isPageExcluded = slicer.processing_rules?.skipped_pages?.includes(pageNumber);
  const hasRectangles = slicer.processing_rules?.annotations.some(
    (annotation) => annotation.page === pageNumber
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {/* <h2 className="text-xl mb-4">Page Content</h2> */}
      {isPageExcluded ? (
        <p className="text-gray-600">No content for page (Excluded)</p>
      ) : hasRectangles ? (
        extractedTexts
          .filter((item) => item.pageNumber === pageNumber)
          .map((item) => (
            <div key={item.id} className="mb-4 p-4 border rounded">
              <p className="font-semibold">Page: {item.pageNumber}</p>
              <p className="text-sm text-gray-600">
                Position: (L: {item.rectangleInfo.left.toFixed(2)}, T: {item.rectangleInfo.top.toFixed(2)})
              </p>
              <p className="text-sm text-gray-600">
                Size: {item.rectangleInfo.width.toFixed(2)} x {item.rectangleInfo.height.toFixed(2)}
              </p>
              <p className="mt-2">{item.text}</p>
            </div>
          ))
      ) : currentPageContent ? (
        <div className="mb-4 p-4 border rounded">
          <p className="font-semibold">Page: {pageNumber}</p>
          <p className="mt-2">{currentPageContent}</p>
        </div>
      ) : (
        <p className="text-gray-600">Loading page content...</p>
      )}
    </div>
  );
};

export default ExtractedTextList;
