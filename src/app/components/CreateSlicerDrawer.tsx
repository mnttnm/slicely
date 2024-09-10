'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerTrigger } from "@/app/components/ui/drawer";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Label } from "@/app/components/ui/label";
import { createSlicer, getUserPDFs, uploadPdf } from '@/server/actions/studio/actions';
import { Tables } from '@/types/supabase-types/database.types';
import { Upload } from 'lucide-react'; // Import the Upload icon

interface CreateSlicerDrawerProps {
  children: React.ReactNode;
}

const CreateSlicerDrawer: React.FC<CreateSlicerDrawerProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ id: string; name: string } | null>(null);
  const [userPDFs, setUserPDFs] = useState<Tables<'pdfs'>[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        const pdfs = await getUserPDFs();
        setUserPDFs(pdfs);
      } catch (error) {
        console.error('Failed to fetch user PDFs:', error);
      }
    };

    if (open) {
      fetchPDFs();
    }
  }, [open]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      const newPdf = await uploadPdf(formData);
      setUserPDFs([...userPDFs, newPdf]);
      setSelectedFile(newPdf.id.toString());
      setUploadedFile({ id: newPdf.id.toString(), name: file.name });
    } catch (error) {
      console.error('Failed to upload PDF:', error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFile || selectedFile === 'no-selection') {
      // Show an error message or handle the case where no file is selected
      return;
    }
    try {
      const fileToUse = uploadedFile || userPDFs.find(pdf => pdf.id.toString() === selectedFile);
      if (!fileToUse) {
        throw new Error('No valid file selected');
      }
      const slicerName = name || `slicer:${fileToUse.name || 'Untitled'}`;
      const slicerDescription = description || `Slicer for ${fileToUse.name || 'Untitled'}`;
      const newSlicer = await createSlicer({
        name: slicerName,
        description: slicerDescription,
        fileId: selectedFile
      });
      setOpen(false);
      router.push(`/studio/slicers/${newSlicer.id}`);
    } catch (error) {
      console.error('Failed to create slicer:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  const isFileSelected = selectedFile && selectedFile !== 'no-selection';

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="bg-gray-100">
        <DrawerHeader>
          <DrawerTitle>Create New Slicer</DrawerTitle>
          <DrawerDescription>Provide details for your new slicer.</DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter slicer name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter slicer description" />
          </div>
          <div className="space-y-2">
            <Label>Select or Upload PDF File</Label>
            <div className="flex space-x-2">
              <Select onValueChange={(value) => {
                setSelectedFile(value);
                if (value === 'no-selection') {
                  setUploadedFile(null);
                }
              }} value={selectedFile || undefined}>
                <SelectTrigger className="flex-grow">
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
                <Button variant="outline" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : (
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
        <DrawerFooter>
          <Button onClick={handleSave} disabled={!isFileSelected}>Save</Button>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateSlicerDrawer;