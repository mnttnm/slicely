'use client'

import React from 'react';
import Link from "next/link";
import { useUser } from "../hooks/useUser";
import { UserProfileMenu } from "@/app/components/UserProfileMenu";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="font-medium text-muted-foreground hover:text-primary transition-colors">
    {children}
  </Link>
);

const Header = React.memo(() => {
  const { user } = useUser();

  return (
    <header className="sticky px-4 top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-center">
        <Link href="/" className="mr-6 flex items-center justify-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
            slicely
          </span>
        </Link>
        {user && (
          <nav className="flex items-center justify-center space-x-6 font-medium">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/document-lab">Document Lab</NavLink>
            <NavLink href="/search">Search</NavLink>
          </nav>
        )}
        <div className="flex flex-1 items-center justify-end space-x-4">
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