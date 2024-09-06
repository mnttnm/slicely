'use client';

import { Card, CardContent } from "@/app/components/ui/card";
import { usePDFContext } from '@/app/contexts/PDFContext';
import Link from 'next/link';

const YourPDFsPage = () => {
  const { pdfs } = usePDFContext();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your PDFs</h1>
      {pdfs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pdfs.map((pdf) => (
            <Link href={`/your-pdfs/${pdf.id}`} key={pdf.id}>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-bold mb-2">{pdf.name}</h3>
                  <p className="text-sm mb-2">Uploaded: {pdf.uploadDate.toLocaleString()}</p>
                  <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Click to view PDF</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p>No PDFs uploaded yet.</p>
      )}
    </div>
  );
};

export default YourPDFsPage;