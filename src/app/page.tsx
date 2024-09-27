import StudioPage from "./(pages)/studio/page";
import { createClient } from "@/server/services/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {

  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect('/login')
  }

  return (
    <StudioPage />
  );
}
