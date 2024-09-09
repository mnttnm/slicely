import { Document, Page } from 'react-pdf';

interface PDFRendererProps {
  url: string;
  pageNumber: number;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onPageRenderSuccess: (page: any) => void;
  skippedPages: number[];
}

const PDFRenderer: React.FC<PDFRendererProps> = ({
  url,
  pageNumber,
  onDocumentLoadSuccess,
  onPageRenderSuccess,
  skippedPages,
}) => (
  <Document file={url} onLoadSuccess={onDocumentLoadSuccess}>
    <Page
      pageNumber={pageNumber}
      onRenderSuccess={onPageRenderSuccess}
      renderTextLayer={true}
      renderAnnotationLayer={true}
    />
    {skippedPages.includes(pageNumber) && (
      <div className="absolute flex items-center justify-center inset-0 bg-red-900/70 py-5">
        <p className="text-center text-white text-xl font-semibold max-w-[50%]">
          This page is excluded from processing, Toggle this page to include it in processing.
        </p>
      </div>
    )}
  </Document >
);

export default PDFRenderer;
