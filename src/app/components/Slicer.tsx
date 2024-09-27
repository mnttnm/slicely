import { Card, CardHeader, CardTitle } from "@/app/components/ui/card";
import { FileIcon, LockIcon } from "lucide-react";
import Link from "next/link";

interface SlicerProps {
  id: string
  fileName: string
  pdf_password: string | null
}

export function Slicer({ id, fileName, pdf_password }: SlicerProps) {
  return (
    <Link href={`/studio/slicers/${id}`} className="block">
      <Card className="dark:bg-gray-900 bg-gray-100 backdrop-blur-sm border border-gray-500 hover:border-gray-300 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center space-x-3">
          <FileIcon className="h-6 w-6 dark:text-gray-50" />
          <CardTitle className="text-lg font-semibold dark:text-gray-300 text-gray-600">{fileName}</CardTitle>
          {pdf_password && <LockIcon className="h-4 w-4 dark:text-gray-300 text-gray-500" />}
        </CardHeader>
      </Card>
    </Link>
  );
}