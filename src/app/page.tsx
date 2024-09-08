'use client'

import { useUser } from "@/app/hooks/useUser";
import { redirect } from "next/navigation";
import DashboardPage from "./(pages)/dashboard/page";
export default function Home() {
  const { user, loading } = useUser()
  if (loading) return <div>Loading...</div>;

  if (!user) {
    // redirect to login page
    redirect("/login");
  }

  return (
    <DashboardPage />
  );
}
