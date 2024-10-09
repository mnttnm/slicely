"use client";

import { Button } from "@/app/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { createSlicer, getUserPDFs, uploadPdf } from "@/server/actions/studio/actions";
import { Tables } from "@/types/supabase-types/database.types";
import { Upload } from "lucide-react"; // Import the Upload icon
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "../hooks/use-toast";

interface CreateSlicerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  defaultDescription?: string;
  defaultFileId?: string;
  onComplete?: (slicerId: string) => void;
}

const CreateSlicerDrawer: React.FC<CreateSlicerDrawerProps> = ({
  open,
  onOpenChange,
  defaultName = "",
  defaultDescription = "",
  defaultFileId = null,
  onComplete
}) => {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);
  const [selectedFile, setSelectedFile] = useState<string | null>(defaultFileId);
  const [uploadedFile, setUploadedFile] = useState<{ id: string; name: string } | null>(null);
  const [userPDFs, setUserPDFs] = useState<Tables<"pdfs">[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        const pdfs = await getUserPDFs();
        setUserPDFs(pdfs);
      } catch (error) {
        console.error("Failed to fetch user PDFs:", error);
      }
    };

    if (open) {
      fetchPDFs();
    }
  }, [open]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedPdfs: Tables<"pdfs">[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("pdf", file);
        const newPdf = await uploadPdf(formData);
        if (newPdf.id) {
          uploadedPdfs.push(newPdf);
        }
      }

      setUserPDFs([...userPDFs, ...uploadedPdfs]);
      if (uploadedPdfs.length > 0) {
        setSelectedFile(uploadedPdfs[0].id.toString());
        setUploadedFile({ id: uploadedPdfs[0].id.toString(), name: uploadedPdfs[0].file_name });
      }
    } catch (error) {
      console.error("Failed to upload PDFs:", error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFile || selectedFile === "no-selection") {
      toast({
        title: "No file selected",
        description: "Please select a file to create a slicer.",
      });
      return;
    }
    try {
      const fileToUse = uploadedFile || userPDFs.find(pdf => pdf.id.toString() === selectedFile);
      if (!fileToUse) {
        throw new Error("No valid file selected");
      }
      const slicerName = name ?? uploadedFile?.name ?? userPDFs.find(pdf => pdf.id.toString() === selectedFile)?.file_name ?? `Slicer  ${new Date().toISOString()}`;
      const slicerDescription = description || `Description for ${slicerName}`;
      const newSlicer = await createSlicer({
        name: slicerName,
        description: slicerDescription,
        fileId: selectedFile,
        processingRules: {
          annotations: [],
          skipped_pages: []
        }
      });
      onComplete?.(newSlicer.id);
      onOpenChange(false);
      router.push(`/studio/slicers/${newSlicer.id}`);
    } catch (error) {
      console.error("Failed to create slicer:", error);
      // Handle error (e.g., show error message to user)
    }
  };

  const isFileSelected = selectedFile && selectedFile !== "no-selection";


  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background text-foreground">
        <DrawerHeader className="border-b border-border">
          <DrawerTitle className="text-xl font-semibold">Create New Slicer</DrawerTitle>
          <DrawerDescription className="text-muted-foreground">Provide details for your new slicer.</DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter slicer name"
              className="bg-input text-input-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter slicer description"
              className="bg-input text-input-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select or Upload PDF File</Label>
            <div className="flex space-x-2">
              <Select
                onValueChange={(value) => {
                  setSelectedFile(value);
                  if (value === "no-selection") {
                    setUploadedFile(null);
                  }
                }}
                value={selectedFile || undefined}
              >
                <SelectTrigger className="flex-grow bg-input text-input-foreground">
                  <SelectValue placeholder="Select a file" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-selection">No file selected</SelectItem>
                  {userPDFs.map((pdf) => (
                    <SelectItem key={pdf.id} value={pdf.id.toString()}>
                      {pdf.file_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" disabled={isUploading} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  {isUploading ? "Uploading..." : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DrawerFooter className="border-t border-border">
          <Button onClick={handleSave} disabled={!isFileSelected} className="bg-primary text-primary-foreground hover:bg-primary/90">Create</Button>
          <Button variant="outline" onClick={handleCancel} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">Cancel</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateSlicerDrawer;