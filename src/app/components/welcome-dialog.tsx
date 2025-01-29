"use client";

import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { welcomeContent } from "@/app/constants/welcome-dialog";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export function WelcomeDialog({ open, onOpenChange, title = welcomeContent.title }: WelcomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <ScrollArea className="h-full pr-4">
          <DialogHeader>
            <div className="mx-auto mb-4">
              <span className="text-3xl font-bold font-orbitron dark:text-neutral-200 text-gray-600">
                Slicely
              </span>
            </div>
            <DialogTitle className="text-xl font-medium text-center">{title}</DialogTitle>
            <DialogDescription className="space-y-4 text-muted-foreground">
              <p>{welcomeContent.description}</p>

              <div className="space-y-6">
                {welcomeContent.steps.map((step) => (
                  <div key={step.title} className="space-y-2">
                    <h3 className="text-base font-medium text-foreground">{step.title}</h3>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      {step.items.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                {welcomeContent.footer}
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 border-0 rounded-md shadow-sm hover:shadow-md hover:shadow-primary/10"
            >
              Let&apos;s Get Started
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}