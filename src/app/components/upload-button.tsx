"use client";

import { Button, ButtonProps } from "@/app/components/ui/button";
import { useFileUpload } from "@/app/hooks/use-file-upload";
import { TablesInsert } from "@/types/supabase-types/database.types";
import { Upload } from "lucide-react";
import { useRef } from "react";

interface UploadButtonProps extends ButtonProps {
  onSuccess?: (pdf: TablesInsert<"pdfs">) => void;
  accept?: string;
  buttonText?: string;
  isTemplate?: boolean;
  className?: string; // Added className prop
}

const UploadButton = ({
  onSuccess,
  accept = ".pdf",
  buttonText = "Upload PDF",
  isTemplate = false,
  className = "", // Destructure className with default value
  ...buttonProps
}: UploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadFile } = useFileUpload(onSuccess);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadFile(file, isTemplate);
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
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`flex items-center ${className}`} // Merge className with existing styles
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