import React from 'react';
import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PDFNavigationProps {
  currentPage: number;
  numPages: number;
  onPageChange: (page: number) => void;
}

const PDFNavigation: React.FC<PDFNavigationProps> = ({ currentPage, numPages, onPageChange }) => {
  return (
    <div className="absolute z-50 bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-full shadow-lg">
      <div className="flex items-center px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="mx-2">
          {currentPage} / {numPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
          disabled={currentPage === numPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PDFNavigation;
