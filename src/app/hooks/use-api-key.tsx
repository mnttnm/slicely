"use client";

import { useToast } from "@/app/hooks/use-toast";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface ApiKeyContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  saveApiKey: (key: string) => boolean;
  removeApiKey: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const storedKey = localStorage.getItem("openai_api_key") || "";
    setApiKey(storedKey);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "openai_api_key") {
        setApiKey(e.newValue || "");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const saveApiKey = useCallback((key: string) => {
    if (key.trim()) {
      const trimmedKey = key.trim();
      localStorage.setItem("openai_api_key", trimmedKey);
      setApiKey(trimmedKey);
      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved successfully.",
      });
      return true;
    }
    return false;
  }, [toast]);

  const removeApiKey = useCallback(() => {
    localStorage.removeItem("openai_api_key");
    setApiKey("");
    toast({
      title: "API Key Removed",
      description: "Your OpenAI API key has been removed successfully.",
    });
  }, [toast]);

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, saveApiKey, removeApiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error("useApiKey must be used within an ApiKeyProvider");
  }
  return context;
}