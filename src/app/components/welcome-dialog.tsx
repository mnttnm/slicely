"use client";

import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { ScrollArea } from "@/app/components/ui/scroll-area";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export function WelcomeDialog({ open, onOpenChange, title = "Welcome to Slicely!" }: WelcomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <ScrollArea className="h-full pr-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="space-y-4">
              <p>
                Slicely is your powerful PDF processing tool that helps you extract, analyze, and understand your PDF documents with ease.
              </p>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/your_video_id"
                  title="Slicely Introduction"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p>
                To get started:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Configure your OpenAI API key in the settings menu</li>
                <li>Upload your PDF document</li>
                <li>Start analyzing and extracting information</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Your API key is stored securely in your browser and is never sent to our servers.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <Button onClick={() => onOpenChange(false)} className="w-full">Got it</Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 