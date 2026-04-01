"use client";

import { APIKeyDialog } from "@/app/components/api-key-dialog";
import { LoginDialog } from "@/app/components/login-dialog";
import { Navbar } from "@/app/components/navbar";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
import { UserMenu } from "@/app/components/user-menu";
import { WelcomeDialog } from "@/app/components/welcome-dialog";
import { useAuth } from "@/app/hooks/use-auth";
import { Info } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Header() {
  const [isAPIKeyDialogOpen, setIsAPIKeyDialogOpen] = useState(false);
  const [isWelcomeDialogOpen, setIsWelcomeDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const { loading, isAuthenticated } = useAuth();

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
      <div className="mx-auto flex h-full justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center justify-center">
            <span className="text-3xl font-bold font-orbitron dark:text-neutral-200 text-gray-600">
              Slicely
            </span>
          </Link>
          {!loading && !isAuthenticated && (
            <HoverCard>
              <HoverCardTrigger>
                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-xs font-normal bg-background/50 backdrop-blur-sm border-primary/20 text-primary/80 px-3 py-1">
                    Read-only mode
                  </Badge>
                  <Info className="h-3.5 w-3.5 text-primary/60" />
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="flex justify-between space-x-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Read-only Access</h4>
                    <p className="text-sm text-muted-foreground">
                      You are viewing demo content. Sign in to create and manage your own slicers and PDFs.
                    </p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>

        <Navbar />

        <div className="flex items-center space-x-4">
          {!loading && (
            isAuthenticated ? (
              <div className="p-1">
                <UserMenu onOpenAPIKey={() => setIsAPIKeyDialogOpen(true)} onOpenHelp={() => setIsHelpDialogOpen(true)} />
              </div>
            ) : (
              <Button variant="default" onClick={() => setIsLoginDialogOpen(true)}>
                Login
              </Button>
            )
          )}
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
      <LoginDialog
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
      />
    </header>
  );
}
