'use client';

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import Link from 'next/link';
import UploadButton from '@/app/components/UploadButton';
import { getUserPDFs, getSlicers } from '@/server/actions/studio/actions';
import { Slicer } from "@/app/components/Slicer";
import { useUser } from "@/app/hooks/useUser";
import { Tables } from '@/types/supabase-types/database.types';

const StudioPage = () => {
  const [pdfs, setPdfs] = useState<(Tables<'pdfs'> & { slicer_ids: string[] })[]>([]);
  const [slicers, setSlicers] = useState<Tables<'slicers'>[]>([]);
  const { user, loading } = useUser();

  const fetchData = async () => {
    try {
      const fetchedPDFs = await getUserPDFs();
      const fetchedSlicers = await getSlicers();
      setPdfs(fetchedPDFs);
      setSlicers(fetchedSlicers);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Handle error (e.g., show a toast notification)
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUploadSuccess = () => {
    fetchData(); // Add this line to refetch data
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to access the Studio.</div>;
  }

  return (
    <div className="px-4">
      <div className="flex justify-between items-center py-1">
        <h1 className="text-xl">Studio</h1>
        <div className="flex gap-2">
          <UploadButton
            onSuccess={handleUploadSuccess}
            buttonText="Upload PDF"
            accept=".pdf"
            isTemplate={false}
          />
        </div>
      </div>

      <Tabs defaultValue="pdfs" className="w-full">
        <TabsList>
          <TabsTrigger value="pdfs">Files</TabsTrigger>
          <TabsTrigger value="slicers">Slicers</TabsTrigger>
        </TabsList>

        <TabsContent value="pdfs" className="mt-2">
          <Table>
            <TableHeader className="hover:bg-transparent">
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Slicer</TableHead>
                <TableHead>Is Template</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pdfs.map((pdf) => (
                <TableRow key={pdf.id} className="hover:bg-neutral-200 dark:hover:bg-neutral-800">
                  <TableCell className="text-gray-500">{pdf.file_name}</TableCell>
                  <TableCell className="text-gray-500">{pdf.created_at ? new Date(pdf.created_at).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell className="text-gray-500">
                    {pdf.slicer_ids && pdf.slicer_ids.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {pdf.slicer_ids.map((slicer_id) => (
                          <Link key={slicer_id} href={`/studio/slicers/${slicer_id}`} className="text-gray-300 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                            {slicer_id}
                          </Link>
                        ))}
                      </div>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-gray-500">{pdf.is_template ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-gray-500">
                    <Link href={`/studio/pdfs/${pdf.id}`}>
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="slicers" className="mt-4">
          {slicers.length === 0 ? (
            <p className="text-gray-500">No slicers available.</p>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slicers.map((slicer) => (
                  <Slicer key={slicer.id} id={slicer.id} fileName={slicer.name} />
                ))}
              </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudioPage;