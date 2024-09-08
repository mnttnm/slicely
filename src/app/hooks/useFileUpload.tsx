import { useState } from "react";
import { usePDFContext } from "@/app/contexts/PDFContext";
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { addPDF } = usePDFContext();
  const router = useRouter();

  const uploadFile = async (file: File) => {
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
    router.push('/document-lab');
  };

  return { isUploading, uploadFile };
};
