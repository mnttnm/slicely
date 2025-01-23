"use client";

import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";
import { useAuth } from "@/app/hooks/use-auth";
import { HelpCircle, Key, LogOut } from "lucide-react";
import { useState } from "react";

interface UserMenuProps {
  onOpenAPIKey: () => void;
  onOpenHelp: () => void;
}

export function UserMenu({ onOpenAPIKey, onOpenHelp }: UserMenuProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "U";

  const userEmail = user?.email || "User";
  const userName = user?.user_metadata?.full_name || userEmail.split("@")[0];

  const handleOpenAPIKey = () => {
    setIsOpen(false);
    onOpenAPIKey();
  };

  const handleOpenHelp = () => {
    setIsOpen(false);
    onOpenHelp();
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full"
        >
          <div className="h-10 w-10 p-4 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium ring-1 ring-primary/20">
            {userInitials}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {/* <DropdownMenuAvatar
          src={user?.user_metadata?.avatar_url}
          fallback={userInitials}
          name={userName}
          email={userEmail}
        /> */}
        <DropdownMenuLabel>
          {userName}
        </DropdownMenuLabel>
        <DropdownMenuLabel className="text-xs text-gray-400">
          {userEmail}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleOpenAPIKey}>
          <Key className="mr-2 h-4 w-4" />
          <span>Configure API Key</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenHelp}>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 