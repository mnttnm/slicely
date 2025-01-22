import { redirect } from "next/navigation";

export default function Home() {
  // Simply redirect to dashboard, no auth check needed here
  // Auth checks will be handled by the dashboard page
  redirect("/dashboard");
}
