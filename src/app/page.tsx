'use client'

import { useUser } from "@/app/hooks/useUser";
import { redirect } from "next/navigation";
export default function Home() {
  const { user, loading } = useUser()
  if (loading) return <div>Loading...</div>;

  if (!user) {
    // redirect to login page
    redirect("/login");
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      Home Page
    </div>
  );
}
