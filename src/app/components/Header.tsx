'use client'

import React from 'react';
import Link from "next/link";
import { useUser } from "../hooks/useUser";
import { UserProfileMenu } from "@/app/components/UserProfileMenu";
import Navbar from "@/app/components/Navbar";
import { ThemeToggle } from "@/app/components/ThemeToggle";

const Header = React.memo(() => {
  const { user } = useUser();

  return (
    <header className="h-[4rem] px-4 py-2 top-0 z-50 w-full border-b border-gray-700/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center justify-center space-x-2">
            <span className="text-3xl font-bold font-orbitron dark:text-neutral-200 text-gray-600 drop-shadow-[0_0_0.3rem_#ffffff70] dark:drop-shadow-[0_0_0.3rem_#ffffff70]">
              Slicely
            </span>
          </Link>
        </div>
        {user && <Navbar />}
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <UserProfileMenu />
              <ThemeToggle />
            </>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;