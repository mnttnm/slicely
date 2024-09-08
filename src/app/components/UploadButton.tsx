'use client';

import { useRef } from "react";
import { Button } from "@/app/components/ui/button";
import { Upload } from "lucide-react";
import { useFileUpload } from "@/app/hooks/useFileUpload";
import { useUser } from "../hooks/useUser";

const UploadButton = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadFile } = useFileUpload();
  const { user, loading } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    throw new Error("User not found");
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".pdf"
        ref={fileInputRef}
        onChange={handleUpload}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          "Uploading..."
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" /> Upload PDF
          </>
        )}
      </Button>
    </>
  );
};

export default UploadButton;