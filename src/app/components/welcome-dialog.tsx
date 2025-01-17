"use client";

import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export function WelcomeDialog({ open, onOpenChange, title = "Welcome to Slicely!" }: WelcomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="space-y-4">
            <p>
              Slicely is your powerful PDF processing tool that helps you extract, analyze, and understand your PDF documents with ease.
            </p>
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
        <Button onClick={() => onOpenChange(false)}>Got it</Button>
      </DialogContent>
    </Dialog>
  );
} 