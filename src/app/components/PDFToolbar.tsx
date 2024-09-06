'use client';

import { Button } from "@/app/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import {
  Pencil,
  Square,
  Trash2,
  RotateCcw,
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface PDFToolbarProps {
  isDrawingMode: boolean;
  isRectangleMode: boolean;
  pageNumber: number;
  numPages: number | null;
  toggleDrawingMode: () => void;
  toggleRectangleMode: () => void;
  deleteSelectedObject: () => void;
  clearAllAnnotations: () => void;
  extractTextFromRectangle: () => void;
  previousPage: () => void;
  nextPage: () => void;
}

const PDFToolbar: React.FC<PDFToolbarProps> = ({
  isDrawingMode,
  isRectangleMode,
  pageNumber,
  numPages,
  toggleDrawingMode,
  toggleRectangleMode,
  deleteSelectedObject,
  clearAllAnnotations,
  extractTextFromRectangle,
  previousPage,
  nextPage,
}) => {
  return (
    <TooltipProvider>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50">
        <div className="flex flex-col gap-2 p-3 bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg">
          {/* Drawing Tool */}
          <ToolbarButton
            icon={<Pencil className="h-5 w-5" />}
            tooltip={`${isDrawingMode ? 'Disable' : 'Enable'} Drawing`}
            onClick={toggleDrawingMode}
            active={isDrawingMode}
          />

          {/* Rectangle Tool */}
          <ToolbarButton
            icon={<Square className="h-5 w-5" />}
            tooltip={`${isRectangleMode ? 'Disable' : 'Enable'} Rectangle`}
            onClick={toggleRectangleMode}
            active={isRectangleMode}
          />

          {/* Delete Selected */}
          <ToolbarButton
            icon={<Trash2 className="h-5 w-5" />}
            tooltip="Delete Selected"
            onClick={deleteSelectedObject}
            variant="destructive"
          />

          {/* Clear All */}
          <ToolbarButton
            icon={<RotateCcw className="h-5 w-5" />}
            tooltip="Clear All"
            onClick={clearAllAnnotations}
          />

          {/* Extract Text */}
          <ToolbarButton
            icon={<FileText className="h-5 w-5" />}
            tooltip="Extract Text"
            onClick={extractTextFromRectangle}
          />

          <div className="h-px bg-gray-400/50 my-2" />

          {/* Previous Page */}
          <ToolbarButton
            icon={<ChevronLeft className="h-5 w-5" />}
            tooltip="Previous Page"
            onClick={previousPage}
            disabled={pageNumber <= 1}
          />

          {/* Page Number */}
          <div className="text-center text-sm text-white font-medium">
            {pageNumber} / {numPages || '--'}
          </div>

          {/* Next Page */}
          <ToolbarButton
            icon={<ChevronRight className="h-5 w-5" />}
            tooltip="Next Page"
            onClick={nextPage}
            disabled={pageNumber >= (numPages ?? 0)}
          />
        </div>
      </div>
    </TooltipProvider>
  );
};

interface ToolbarButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  tooltip,
  onClick,
  active = false,
  disabled = false,
  variant = 'default',
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant={active ? 'secondary' : variant}
        size="icon"
        onClick={onClick}
        disabled={disabled}
        className={`transition-all duration-200 ${active ? 'bg-white text-gray-800' : 'bg-gray-700/50 text-white hover:bg-gray-600/50'
          }`}
      >
        {icon}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="right" className="bg-gray-800 text-white">
      <p>{tooltip}</p>
    </TooltipContent>
  </Tooltip>
);

export default PDFToolbar;
