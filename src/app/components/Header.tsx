"use client";

import { APIKeyDialog } from "@/app/components/api-key-dialog";
import { Navbar } from "@/app/components/navbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
// import { ModeToggle } from "@/app/components/ui/mode-toggle";
import { WelcomeDialog } from "@/app/components/welcome-dialog";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export function Header() {
  const [isAPIKeyDialogOpen, setIsAPIKeyDialogOpen] = useState(false);
  const [isWelcomeDialogOpen, setIsWelcomeDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  useEffect(() => {
    // Check if it's the first visit
    const hasVisited = localStorage.getItem("hasVisitedBefore");
    if (!hasVisited) {
      setIsWelcomeDialogOpen(true);
      localStorage.setItem("hasVisitedBefore", "true");
    }
  }, []);

  return (
    <header className="h-[4rem] px-4 py-2 top-0 z-50 w-full border-b border-gray-700/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-full items-center justify-between max-w-7xl">
        <div className="flex items-center">
          <Link href="/" className="flex items-center justify-center space-x-2">
            <span className="text-3xl font-bold font-orbitron dark:text-neutral-200 text-gray-600 drop-shadow-[0_0_0.3rem_#ffffff70] dark:drop-shadow-[0_0_0.3rem_#ffffff70]">
              Slicely
            </span>
          </Link>
        </div>

        <Navbar />

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAPIKeyDialogOpen(true)}>
                Configure OpenAI API Key
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsHelpDialogOpen(true)}>
                Help
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* <ModeToggle /> */}
        </div>
      </div>
      <APIKeyDialog
        open={isAPIKeyDialogOpen}
        onOpenChange={setIsAPIKeyDialogOpen}
      />
      <WelcomeDialog
        open={isWelcomeDialogOpen}
        onOpenChange={setIsWelcomeDialogOpen}
      />
      <WelcomeDialog
        open={isHelpDialogOpen}
        onOpenChange={setIsHelpDialogOpen}
        title="How to use Slicely"
      />
    </header>
  );
}
