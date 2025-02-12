"use client";

import { Button } from "@/app/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { useUser } from "@/app/hooks/use-user";
import { logout } from "@/server/actions/login/actions";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function UserProfileMenu() {
  const router = useRouter();
  const { user, loading } = useUser();

  if (loading) return null;

  if (!user) {
    throw new Error("User not found");
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Image
            src={user.user_metadata.avatar_url || "/default-avatar.png"}
            alt="User avatar"
            className="rounded-full"
            width={32}
            height={32}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => router.push("/profile")}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleLogout}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

  );
}