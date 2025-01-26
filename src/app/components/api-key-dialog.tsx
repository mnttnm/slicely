"use client";

import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { useApiKey } from "@/app/hooks/use-api-key";
import { useEffect } from "react";

interface APIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function APIKeyDialog({ open, onOpenChange }: APIKeyDialogProps) {
  const { apiKey, setApiKey, saveApiKey, removeApiKey } = useApiKey();

  useEffect(() => {
    if (open) {
      const storedKey = localStorage.getItem("openai_api_key") || "";
      setApiKey(storedKey);
    }
  }, [open, setApiKey]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      removeApiKey();
      onOpenChange(false);
    } else {
      if (saveApiKey(apiKey)) {
        onOpenChange(false);
      }
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
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              Save API Key
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}