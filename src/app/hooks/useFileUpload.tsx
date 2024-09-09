import { useState } from "react";
import { usePDFContext } from "@/app/contexts/PDFContext";
import { v4 as uuidv4 } from 'uuid';
import { uploadPdf } from '@/server/actions/studio/actions';
import { useRouter } from "next/navigation";
import { useToast } from "@/app/hooks/use-toast";

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { addPDF } = usePDFContext();
  const router = useRouter();
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('slicer_id', ''); // Add slicer_id if needed
      formData.append('is_template', 'false'); // Set is_template as needed

      console.log("Uploading file:", file);

      const result = await uploadPdf(formData);

      const pdfMetadata = {
        id: result.id || uuidv4(),
        name: result.file_name,
        url: result.file_path || URL.createObjectURL(file),
        uploadDate: new Date(),
      };

      addPDF(pdfMetadata);
      router.push('/studio');
      router.refresh();
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadFile };
};
