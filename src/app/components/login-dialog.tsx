"use client";

import GoogleSignInButton from "@/app/components/google-signin-button";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { login, signup } from "@/server/actions/login/actions";
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

  const handleFormAction = async (formData: FormData, action: typeof login | typeof signup) => {
    await action(formData);
    handleLoginSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>Enter your credentials to access your account.</DialogDescription>
        </DialogHeader>
        <form>
          <div className="space-y-4">
            <Input id="email" name="email" type="email" placeholder="Email" required />
            <Input id="password" name="password" type="password" placeholder="Password" required />
            <Button className="w-full" formAction={(data) => handleFormAction(data, login)}>
              Log in
            </Button>
            <Button className="w-full" formAction={(data) => handleFormAction(data, signup)} variant="outline">
              Sign up
            </Button>
          </div>
        </form>
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <DialogFooter className="flex flex-col space-y-2">
          <GoogleSignInButton />
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
} 