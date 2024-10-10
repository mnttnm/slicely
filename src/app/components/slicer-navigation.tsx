"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { useRef, useState } from "react";

interface Slicer {
  id: string;
  name: string;
}

interface SlicerNavigationProps {
  slicers: Slicer[];
  activeSlicer: string | null;
  onSlicerSelect: (id: string) => void;
}

export function SlicerNavigation({ slicers, activeSlicer, onSlicerSelect }: SlicerNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300); // Delay closing to allow user to reach the popover
  };

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div
            className="w-16 h-full flex flex-col justify-center items-center py-4 cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {slicers.map((slicer) => (
              <div
                key={slicer.id}
                className="w-full px-6 py-2"
              >
                <div
                  className={`h-px transition-all duration-200 ease-in-out ${activeSlicer === slicer.id ? "bg-primary" : "bg-muted-foreground"}`}
                  style={{ width: `${Math.min(80, slicer.name.length * 3)}%` }}
                />
              </div>
            ))}
          </div>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={1}
          className="w-64 max-h-[calc(100vh-2rem)] overflow-y-auto p-0"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="p-2">
            <h3 className="font-semibold mb-2">Slicers</h3>
            {slicers.map((slicer) => (
              <button
                key={slicer.id}
                onClick={() => {
                  onSlicerSelect(slicer.id);
                  setIsOpen(false);
                }}
                className="block w-full text-left hover:bg-accent hover:text-accent-foreground p-2 rounded"
              >
                {slicer.name}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}