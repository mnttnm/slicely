import { useToast } from "@/app/hooks/use-toast";
import { uploadMultiplePdfs, uploadPdf } from "@/server/actions/studio/actions";
import { TablesInsert } from "@/types/supabase-types/database.types";
import { useState } from "react";

export const useFileUpload = (onSuccess?: (pdf: TablesInsert<"pdfs">[]) => void) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File, isTemplate = false) => {
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

      onSuccess?.([result]);

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

  const uploadFiles = async (files: File[], isTemplate: boolean) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append("pdfs", file));
      formData.append("is_template", isTemplate.toString());

      const uploadedPDFs = await uploadMultiplePdfs(formData);

      if (onSuccess) {
        onSuccess(uploadedPDFs);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadFile, uploadFiles };
};
