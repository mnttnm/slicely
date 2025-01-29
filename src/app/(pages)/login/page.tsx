import GoogleSignInButton from "@/app/components/google-signin-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to access your account.</CardDescription>
        </CardHeader>
        {/* Email login form commented out
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
        */}
        <CardContent className="flex flex-col space-y-4">
          <GoogleSignInButton />
        </CardContent>
      </Card>
    </div>
  );
}