import { useState } from "react";
import { useToast } from "@/app/hooks/use-toast";
import { uploadPdf } from "@/server/actions/studio/actions";
import { TablesInsert } from "@/types/supabase-types/database.types";

export const useFileUpload = (onSuccess?: (pdf: TablesInsert<'pdfs'>) => void) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File, isTemplate: boolean = false) => {
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("is_template", isTemplate.toString());

      const result = await uploadPdf(formData);

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      });

      onSuccess?.(result);

      return result;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadFile };
};
