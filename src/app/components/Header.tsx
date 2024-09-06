import Image from "next/image";
import UploadButton from "@/app/components/UploadButton";
import Link from "next/link";

const Header = () => {
  return (
    <div className="flex justify-between items-center p-4">
      <Link href="/">
        <Image src="/logo.png" alt="PDF Made Easy" width={64} height={64} />
      </Link>
      <div className="flex items-center">
        <UploadButton />
      </div>
    </div>
  );
};

export default Header;