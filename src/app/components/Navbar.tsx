'use client'

import React from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { cn } from "@/app/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

const NavLink = ({ href, children }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "text-gray-400 hover:text-gray-500 transition-colors font-medium",
        isActive && "text-gray-500 font-semibold"
      )}
    >
      {children}
    </Link>
  );
};

const Navbar = () => (
  <nav className="flex flex-1 items-center justify-center space-x-6 mx-auto font-medium">
    <NavLink href="/dashboard">Dashboard</NavLink>
    <NavLink href="/studio">Studio</NavLink>
    <NavLink href="/search">Search</NavLink>
  </nav>
);

export default Navbar;