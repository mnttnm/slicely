import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { LockIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface LoginRequiredMessageProps {
  title?: string;
  description?: string;
  showLoginButton?: boolean;
  className?: string;
}

export function LoginRequiredMessage({
  title = "Login Required",
  description = "Please login to access this feature.",
  showLoginButton = true,
  className = "",
}: LoginRequiredMessageProps) {
  const router = useRouter();

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="space-y-1 flex items-center text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <LockIcon className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {showLoginButton && (
        <CardContent className="flex justify-center">
          <Button onClick={() => router.push("/login")} variant="default">
            Login to Continue
          </Button>
        </CardContent>
      )}
    </Card>
  );
} 