'use client';

import { useState, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import { Upload } from "lucide-react";
import { usePDFContext } from "@/app/contexts/PDFContext";
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

const UploadButton = () => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addPDF } = usePDFContext();
  const router = useRouter();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // TODO: Implement actual file upload logic here
    console.log("Uploading file:", file.name);
    // Simulating upload delay and getting a URL
    await new Promise(resolve => setTimeout(resolve, 2000));
    const fakeUrl = URL.createObjectURL(file);

    const pdfMetadata = {
      id: uuidv4(),
      name: file.name,
      url: fakeUrl,
      uploadDate: new Date(),
    };

    addPDF(pdfMetadata);
    setIsUploading(false);
    router.push('/your-pdfs');
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