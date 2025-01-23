"use client";

import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Input } from "@/app/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import {
  BanIcon,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  RotateCcw,
  Square,
  Trash2
} from "lucide-react";
import { useState } from "react";

interface PDFToolbarProps {
  isRectangleMode: boolean;
  pageNumber: number;
  numPages: number | null;
  toggleRectangleMode: () => void;
  deleteSelectedObject: () => void;
  clearCurrentPage: () => void;
  clearAllPages: () => void;
  previousPage: () => void;
  nextPage: () => void;
  isPageSkipped: boolean;
  togglePageSkip: () => void;
  includeAllPages: () => void;
  excludeAllPages: () => void;
  jumpToPage: (page: number) => void;
}

const PDFToolbar: React.FC<PDFToolbarProps> = ({
  isRectangleMode,
  pageNumber,
  numPages,
  toggleRectangleMode,
  deleteSelectedObject,
  clearCurrentPage: clearAnnotationFromCurrentPage,
  previousPage,
  nextPage,
  isPageSkipped,
  togglePageSkip,
  clearAllPages,
  includeAllPages,
  excludeAllPages,
  jumpToPage,
}) => {
  const [isJumpToPageOpen, setIsJumpToPageOpen] = useState(false);
  const [jumpToPageNumber, setJumpToPageNumber] = useState("");

  const handleJumpToPage = () => {
    const pageNumber = parseInt(jumpToPageNumber, 10);
    if (pageNumber && pageNumber > 0 && numPages && pageNumber <= numPages) {
      jumpToPage(pageNumber);
      setIsJumpToPageOpen(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-50">
        <div className="flex flex-col gap-2 p-3 bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg">
          {/* Include Section */}
          <ToolbarButton
            icon={<Square className="h-5 w-5" />}
            tooltip={`${isRectangleMode ? "Disable" : "Enable"} Section Extraction`}
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
            tooltip="Clear Annotations on this page"
            onClick={clearAnnotationFromCurrentPage}
          />

          <div className="h-px bg-gray-400/50 my-2" />

          {/* Skip this page */}
          <ToolbarButton
            icon={<BanIcon className="h-5 w-5" />}
            tooltip={isPageSkipped ? "Include this page" : "Exclude this page"}
            onClick={togglePageSkip}
            active={isPageSkipped}
          />

          {/* Previous Page */}
          <ToolbarButton
            icon={<ChevronLeft className="h-5 w-5" />}
            tooltip="Previous Page"
            onClick={previousPage}
            disabled={pageNumber <= 1}
          />

          {/* Page Number */}
          <div className="text-center text-sm text-white font-medium">
            {pageNumber} / {numPages || "--"}
          </div>

          {/* Next Page */}
          <ToolbarButton
            icon={<ChevronRight className="h-5 w-5" />}
            tooltip="Next Page"
            onClick={nextPage}
            disabled={pageNumber >= (numPages ?? 0)}
          />

          {/* Action Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="bg-gray-700/50 text-white hover:bg-gray-600/50"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right">
              <DropdownMenuItem onClick={clearAllPages}>
                Clear All Pages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={includeAllPages}>
                Include All Pages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={excludeAllPages}>
                Exclude All Pages
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsJumpToPageOpen(true)}>
                Jump to Page
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Jump to Page Dialog */}
          <Dialog open={isJumpToPageOpen} onOpenChange={setIsJumpToPageOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Jump to Page</DialogTitle>
              </DialogHeader>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="1"
                  max={numPages ?? 0}
                  value={jumpToPageNumber}
                  onChange={(e) => setJumpToPageNumber(e.target.value)}
                  placeholder="Enter page number"
                />
                <Button onClick={handleJumpToPage}>Go</Button>
              </div>
            </DialogContent>
          </Dialog>
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
  variant?: "default" | "destructive";
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  tooltip,
  onClick,
  active = false,
  disabled = false,
  variant = "default",
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant={active ? "secondary" : variant}
        size="icon"
        onClick={onClick}
        disabled={disabled}
        className={`transition-all duration-200 ${active ? "bg-white text-gray-800" : "bg-gray-700/50 text-white hover:bg-gray-600/50"
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
