import GoogleSignInButton from "@/app/components/google-signin-button";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { login, signup } from "@/server/actions/login/actions";

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="space-y-4">
              <Input id="email" name="email" type="email" placeholder="Email" required />
              <Input id="password" name="password" type="password" placeholder="Password" required />
              <Button className="w-full" formAction={login}>Log in</Button>
              <Button className="w-full" formAction={signup} variant="outline">Sign up</Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <GoogleSignInButton />
        </CardFooter>
      </Card>
    </div>
  );
}