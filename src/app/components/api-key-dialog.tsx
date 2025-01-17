"use client";

import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { useToast } from "@/app/hooks/use-toast";
import { useState } from "react";

interface APIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function APIKeyDialog({ open, onOpenChange }: APIKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem("openai_api_key", apiKey.trim());
      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved successfully.",
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>OpenAI API Key</DialogTitle>
          <DialogDescription>
            Enter your OpenAI API key to use Slicely. Your key is stored locally and never sent to our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <Button onClick={handleSave} className="w-full">
            Save API Key
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 