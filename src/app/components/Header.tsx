'use client'

import React from 'react';
import Image from "next/image";
import UploadButton from "@/app/components/UploadButton";
import Link from "next/link";
import { useUser } from "../hooks/useUser";
import { UserButton } from "@/app/components/UserProfileMenu";

const Header = React.memo(() => {
  const { user } = useUser();

  return (
    <div className="flex justify-between items-center p-4">
      <Link href="/">
        <Image src="/logo.png" alt="PDF Made Easy" width={64} height={64} />
      </Link>
      <div className="flex items-center">
        {user && (
          <div className="flex items-center">
            <UploadButton />
            <UserButton />
          </div>
        )}
      </div>
    </div>
  );
});

Header.displayName = 'Header';

export default Header;