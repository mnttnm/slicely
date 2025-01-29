"use client";

import GoogleSignInButton from "@/app/components/google-signin-button";
import {
  Dialog,
  DialogContent,
  DialogHeader
} from "@/app/components/ui/dialog";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const router = useRouter();

  const handleLoginSuccess = () => {
    onOpenChange(false);
    router.push("/dashboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            <span className="text-3xl font-bold font-orbitron dark:text-neutral-200 text-gray-600">
              Slicely
            </span>
          </div>
          <DialogTitle className="text-xl font-medium tracking-tight">Welcome Back</DialogTitle>
          <DialogDescription className="mt-4 space-y-3 text-muted-foreground">
            <p>Sign in to unlock the full potential of Slicely:</p>
            <ul className="space-y-2 text-sm text-left list-disc pl-4">
              <li>Create custom PDF slicers</li>
              <li>Extract data securely</li>
              <li>Chat with your documents</li>
              <li>Control data processing</li>
              <li>Access insights dashboard</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <GoogleSignInButton />
        </div>
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}