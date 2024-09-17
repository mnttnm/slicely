'use client';

import { useRef } from "react";
import { Button, ButtonProps } from "@/app/components/ui/button";
import { Upload } from "lucide-react";
import { useFileUpload } from "@/app/hooks/useFileUpload";
import { TablesInsert } from "@/types/supabase-types/database.types";

interface UploadButtonProps extends ButtonProps {
  onSuccess?: (pdf: TablesInsert<'pdfs'>) => void;
  accept?: string;
  buttonText?: string;
  isTemplate?: boolean;
}

const UploadButton = ({
  onSuccess,
  accept = ".pdf",
  buttonText = "Upload PDF",
  isTemplate = false,
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