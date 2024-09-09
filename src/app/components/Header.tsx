'use client'

import React from 'react';
import Link from "next/link";
import { useUser } from "../hooks/useUser";
import { UserProfileMenu } from "@/app/components/UserProfileMenu";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-gray-400 hover:text-gray-200 transition-colors font-medium">
    {children}
  </Link>
);

const Header = React.memo(() => {
  const { user } = useUser();

  return (
    <header className="px-4 py-2 top-0 z-50 w-full border-b border-gray-700/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center justify-center space-x-2">
            <span className="text-3xl font-bold font-orbitron dark:text-neutral-200 text-gray-600 drop-shadow-[0_0_0.3rem_#ffffff70]">
              Slicely
            </span>
          </Link>
        </div>
        {user && (
          <nav className="flex flex-1 items-center justify-center space-x-6 mx-auto font-medium">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/studio">Studio</NavLink>
            <NavLink href="/search">Search</NavLink>
          </nav>
        )}
        <div className="flex items-center space-x-4">
          {user && (
            <>
              {/* <UploadButton /> */}
              <UserProfileMenu />
            </>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;