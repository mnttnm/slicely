'use client'

import { Button } from "@/app/components/ui/button"
import { createClient } from "../../utils/supabase/client"

export default function GoogleSignInButton() {
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })
  }

  return (
    <Button className="w-full" variant="outline" onClick={handleGoogleSignIn}>
      Google
    </Button>
  )
}
