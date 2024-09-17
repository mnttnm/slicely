import Link from "next/link";
import { PDFMetadata } from "@/app/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";

interface LinkedPdfsProps {
  linkedPdfs: PDFMetadata[];
}

export function LinkedPdfs({ linkedPdfs }: LinkedPdfsProps) {
  return (
    <div className="flex flex-col h-full px-2">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PDF Name</TableHead>
              <TableHead>Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linkedPdfs.map((pdf) => (
              <TableRow key={pdf.id}>
                <TableCell className="font-medium">{pdf.name}</TableCell>
                <TableCell>
                  <Link
                    href={`/studio/pdfs/${pdf.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View PDF
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}