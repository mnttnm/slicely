"use client";

import { Button, ButtonProps } from "@/app/components/ui/button";
import { useFileUpload } from "@/app/hooks/use-file-upload";
import { TablesInsert } from "@/types/supabase-types/database.types";
import { Upload } from "lucide-react";
import { useRef } from "react";

interface UploadButtonProps extends ButtonProps {
  onSuccess?: (pdfs: TablesInsert<"pdfs">[]) => void;
  accept?: string;
  buttonText?: string;
  isTemplate?: boolean;
  className?: string;
}

const UploadButton = ({
  onSuccess,
  accept = ".pdf",
  buttonText = "Upload PDFs",
  isTemplate = false,
  className = "",
  ...buttonProps
}: UploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadFiles } = useFileUpload(onSuccess);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await uploadFiles(Array.from(files), isTemplate);
    }
  };

  return (
    <>
      <input
        type="file"
        accept={accept}
        ref={fileInputRef}
        onChange={handleUpload}
        className="hidden"
        multiple
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`flex items-center ${className}`}
        {...buttonProps}
      >
        {isUploading ? (
          "Uploading..."
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" /> {buttonText}
          </>
        )}
      </Button>
    </>
  );
};

export default UploadButton;