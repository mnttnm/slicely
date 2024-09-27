import { Button } from "@/app/components/ui/button";
import Link from "next/link";

const LoginButton = () => {
  return (
    <Link href="/login">
      <Button>
        Login
      </Button>
    </Link>
  );
};

export default LoginButton;