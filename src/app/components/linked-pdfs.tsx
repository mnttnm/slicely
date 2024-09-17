"use client";
import { PDFMetadata, } from "@/app/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Checkbox } from "@/app/components/ui/checkbox";
import UploadButton from "@/app/components/UploadButton";
import { useUser } from "@/app/hooks/useUser";
import { TablesInsert } from "@/types/supabase-types/database.types";
import { useState } from "react";
import { Button } from "./ui/button";
import { Eye, Play, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
interface LinkedPdfsProps {
  linkedPdfs: PDFMetadata[];
  onUploadSuccess: (pdf: TablesInsert<'pdfs'>) => void;
}

export function LinkedPdfs({ linkedPdfs, onUploadSuccess }: LinkedPdfsProps) {
  const { user, loading } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    throw new Error("User not found");
  }

  const processAllPdfs = async () => {
    setIsProcessing(true);
    try {
      for (const pdf of linkedPdfs) {
        await processPdf(pdf);
      }
      alert("All PDFs processed successfully!");
    } catch (error) {
      console.error("Error processing PDFs:", error);
      alert("An error occurred while processing PDFs.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processPdf = async (pdf: PDFMetadata) => {
    // Implement the logic to apply slicer rules and extract text from the PDF
    // This is a placeholder function and should be replaced with actual processing logic
    console.log(`Processing PDF: ${pdf.file_name}`);
    // Example: await applySlicerRules(pdf);
  };

  const viewPdf = (pdfId: string) => {
    // navigate to the pdf viewer
    router.push(`/studio/pdfs/${pdfId}`);
  };

  const processSinglePdf = async (pdf: PDFMetadata) => {
    setIsProcessing(true);
    try {
      await processPdf(pdf);
      alert(`PDF ${pdf.file_name} processed successfully!`);
    } catch (error) {
      console.error(`Error processing PDF ${pdf.file_name}:`, error);
      alert(`An error occurred while processing PDF ${pdf.file_name}.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full mt-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Linked PDFs</h2>
        <div className="flex space-x-2">
          <Button
            onClick={processAllPdfs}
            className="btn btn-primary"
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Process All"}
          </Button>
          <UploadButton
            onSuccess={onUploadSuccess}
            buttonText="Upload More file"
            variant="outline"
            isTemplate={false}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox />
              </TableHead>
              <TableHead className="w-[30%]">Name</TableHead>
              <TableHead className="w-[20%]">Uploaded at</TableHead>
              <TableHead className="w-[20%]">Status</TableHead>
              <TableHead className="w-[210px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linkedPdfs.map((pdf) => (
              <TableRow key={pdf.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell className="font-medium">{pdf.file_name}</TableCell>
                <TableCell>{pdf.updated_at ?? 'N/A'}</TableCell>
                <TableCell>{pdf.file_processing_status ?? 'N/A'}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewPdf(pdf.id)}
                      className="flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => processSinglePdf(pdf)}
                      disabled={isProcessing}
                      className="flex items-center"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Process
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="px-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => console.log(`Delete PDF: ${pdf.id}`)}>
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log(`Change slicer for PDF: ${pdf.id}`)}>
                          Change Slicer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}