"use client";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import UploadButton from "@/app/components/upload-button";
import { useAuth } from "@/app/hooks/use-auth";
import { PDFMetadata } from "@/app/types";
import { handlePDFProcessing } from "@/services/pdf-processing-service";
import { TablesInsert } from "@/types/supabase-types/database.types";
import { Eye, MoreVertical, Play } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface LinkedPdfsProps {
  linkedPdfs: PDFMetadata[];
  onUploadSuccess: (pdfs: TablesInsert<"pdfs">[]) => void;
  onRefresh: () => void;
}

export function LinkedPdfs({ linkedPdfs, onUploadSuccess, onRefresh }: LinkedPdfsProps) {
  const { id: slicerId } = useParams();
  const { isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPdfs, setSelectedPdfs] = useState<string[]>([]);
  const router = useRouter();

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
    if (!isAuthenticated) return;
    setIsProcessing(true);
    try {
      await Promise.all(linkedPdfs.map(pdf => handlePDFProcessing(pdf as PDFMetadata, slicerId as string)));
      alert("All PDFs processed successfully!");
      onRefresh();
    } catch (error) {
      console.error("Error processing PDFs:", error);
      alert("An error occurred while processing PDFs.");
    } finally {
      setIsProcessing(false);
    }
  };

  const viewPdf = (pdfId: string) => {
    router.push(`/studio/pdfs/${pdfId}`);
  };

  const processSinglePdf = async (pdf: PDFMetadata) => {
    if (!isAuthenticated) return;
    setIsProcessing(true);
    try {
      await handlePDFProcessing(pdf, slicerId as string);
      onRefresh();
      router.refresh();
    } catch (error) {
      console.error(`Error processing PDF ${pdf.file_name}:`, error);
      alert(`An error occurred while processing PDF ${pdf.file_name}.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Linked PDFs ({linkedPdfs.length})</h2>
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={processAllPdfs}
                    disabled={!isAuthenticated || isProcessing}
                    className="btn btn-primary"
                  >
                    {isProcessing ? "Processing..." : "Process All"}
                  </Button>
                </div>
              </TooltipTrigger>
              {!isAuthenticated && (
                <TooltipContent>
                  <p>Sign in to process PDFs</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <UploadButton
                    onSuccess={onUploadSuccess}
                    buttonText="Upload More files"
                    variant="outline"
                    isTemplate={false}
                    disabled={!isAuthenticated}
                  />
                </div>
              </TooltipTrigger>
              {!isAuthenticated && (
                <TooltipContent>
                  <p>Sign in to upload PDFs</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedPdfs.length === linkedPdfs.length}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  disabled={!isAuthenticated}
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
                    disabled={!isAuthenticated}
                  />
                </TableCell>
                <TableCell className="font-medium">{pdf.file_name}</TableCell>
                <TableCell>{pdf.updated_at ?? "N/A"}</TableCell>
                <TableCell>{pdf.file_processing_status ?? "N/A"}</TableCell>
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
                    {isAuthenticated && (
                      <>
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
                      </>
                    )}
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