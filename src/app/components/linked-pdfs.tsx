"use client";
import { PDFMetadata } from "@/app/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Star } from "lucide-react";
import UploadButton from "@/app/components/UploadButton";
import { useUser } from "@/app/hooks/useUser";
import { TablesInsert } from "@/types/supabase-types/database.types";

interface LinkedPdfsProps {
  linkedPdfs: PDFMetadata[];
  onUploadSuccess: (pdf: TablesInsert<'pdfs'>) => void;
}

export function LinkedPdfs({ linkedPdfs, onUploadSuccess }: LinkedPdfsProps) {
  const { user, loading } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    throw new Error("User not found");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Linked PDFs</h2>
        <UploadButton
          onSuccess={onUploadSuccess}
          buttonText="Upload More file"
          variant="outline"
          isTemplate={false}
        />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Uploaded at</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linkedPdfs.map((pdf) => (
              <TableRow key={pdf.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell className="font-medium">{pdf.name}</TableCell>
                <TableCell>{pdf.uploadDate.toLocaleDateString()}</TableCell>
                <TableCell>{pdf.status}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Star className="w-5 h-5 text-gray-400 cursor-pointer hover:text-yellow-400" />
                    <Star className="w-5 h-5 text-gray-400 cursor-pointer hover:text-yellow-400" />
                    <Star className="w-5 h-5 text-gray-400 cursor-pointer hover:text-yellow-400" />
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