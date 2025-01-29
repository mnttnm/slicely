"use client";

import { Button } from "@/app/components/ui/button";
import { createClient } from "@/server/services/supabase/client";

export default function GoogleSignInButton() {

  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // eslint-disable-next-line n/no-process-env
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
  };

  return (
    <Button className="w-full" variant="outline" onClick={handleGoogleSignIn}>
      Sign in with Google
    </Button>
  );
}
