"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { PDFMetadata } from "@/app/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Checkbox } from "@/app/components/ui/checkbox";
import UploadButton from "@/app/components/UploadButton";
import { useUser } from "@/app/hooks/useUser";
import { TablesInsert } from "@/types/supabase-types/database.types";
import { Button } from "./ui/button";
import { Eye, Play, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { ProcessPdf } from "@/services/pdfProcessingService";
import { getSlicerDetails, saveProcessedOutput, updatePDF } from "@/server/actions/studio/actions";

interface LinkedPdfsProps {
  linkedPdfs: PDFMetadata[];
  onUploadSuccess: (pdf: TablesInsert<'pdfs'>) => void;
  onRefresh: () => void; // Add this prop
}

export function LinkedPdfs({ linkedPdfs, onUploadSuccess, onRefresh }: LinkedPdfsProps) {
  const { id: slicerId } = useParams();
  const { user, loading } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPdfs, setSelectedPdfs] = useState<string[]>([]);
  const router = useRouter();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    throw new Error("User not found");
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPdfs(linkedPdfs.map(pdf => pdf.id));
    } else {
      setSelectedPdfs([]);
    }
  };

  const handleSelectPdf = (pdfId: string, checked: boolean) => {
    if (checked) {
      setSelectedPdfs(prev => [...prev, pdfId]);
    } else {
      setSelectedPdfs(prev => prev.filter(id => id !== pdfId));
    }
  };

  const processAllPdfs = async () => {
    setIsProcessing(true);
    try {
      for (const pdf of linkedPdfs) {
        await processPdf(pdf);
      }
      alert("All PDFs processed successfully!");
      onRefresh(); // Trigger refresh after processing all PDFs
    } catch (error) {
      console.error("Error processing PDFs:", error);
      alert("An error occurred while processing PDFs.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processPdf = async (pdf: PDFMetadata) => {
    if (!slicerId) {
      alert(`No slicer associated with PDF ${pdf.file_name}. Please link a slicer first.`);
      return;
    }

    try {
      const { slicerDetails } = await getSlicerDetails(slicerId as string) ?? {};

      if (!slicerDetails) {
        alert(`No slicer associated with PDF ${pdf.file_name}. Please link a slicer first.`);
        return;
      }

      const result = await ProcessPdf({ ...pdf, password: slicerDetails.pdf_password ?? undefined }, slicerId as string);

      // TODO: Currently it generates a new output every time,
      // so, even if the PDF is already processed, it will generate a new output.
      // We need to check if the output already exists in the database.
      // If it exists, we need to update the output.
      // Or while showing the output, we can show a timeline of the outputs.
      // If it doesn't exist, we need to insert the output.
      result.forEach(async (output) => {
        await saveProcessedOutput(output);
      });

      const updatedData: Partial<PDFMetadata> = {
        file_processing_status: "processed",
      };

      try {
        await updatePDF(pdf.id, updatedData);
        onRefresh(); // Trigger refresh after processing a single PDF
        router.refresh();
      } catch (error) {
        console.error(`Error updating PDF ${pdf.file_name} status:`, error);
        alert(`An error occurred while updating the status of PDF ${pdf.file_name}.`);
      }
    } catch (error) {
      console.error(`Error processing PDF ${pdf.file_name}:`, error);
      alert(`An error occurred while processing PDF ${pdf.file_name}.`);
    }
  };

  const viewPdf = (pdfId: string) => {
    // navigate to the pdf viewer
    router.push(`/studio/pdfs/${pdfId}`);
  };

  const processSinglePdf = async (pdf: PDFMetadata) => {
    setIsProcessing(true);
    try {
      await processPdf(pdf);
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
        <h2 className="text-2xl font-semibold">Linked PDFs ({linkedPdfs.length})</h2>
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
                <Checkbox
                  checked={selectedPdfs.length === linkedPdfs.length}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                />
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
                  <Checkbox
                    checked={selectedPdfs.includes(pdf.id)}
                    onCheckedChange={(checked) => handleSelectPdf(pdf.id, checked as boolean)}
                  />
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