"use client";

import { cn } from "@/app/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

const NavLink = ({ href, children }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "text-gray-500 hover:text-gray-600 dark:text-white-100 dark:hover:text-gray-300 transition-colors font-medium",
        isActive && "text-gray-600 dark:text-gray-100"
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
  </nav>
);

export { Navbar };
