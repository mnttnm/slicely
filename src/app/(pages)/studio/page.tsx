import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import Link from 'next/link';
import UploadButton from '@/app/components/UploadButton';
import { getUserPDFs, getSlicers } from '@/server/actions/studio/actions';
import { Slicer } from "@/app/components/Slicer";
import { Button } from "@/app/components/ui/button";
import { PlusIcon } from "lucide-react";
import CreateSlicerDrawer from "@/app/components/CreateSlicerDrawer";

const StudioPage = async () => {
  const pdfs = await getUserPDFs();
  const slicers = await getSlicers(); // Assuming you have this function

  return (
    <div className="px-4">
      <div className="flex justify-between items-center py-1">
        <h1 className="text-xl">Studio</h1>
        <div className="flex gap-2">
          <UploadButton />
          <CreateSlicerDrawer>
            <Button variant="outline">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Slicer
            </Button>
          </CreateSlicerDrawer>
        </div>
      </div>

      <Tabs defaultValue="pdfs" className="w-full">
        <TabsList>
          <TabsTrigger value="pdfs">Files</TabsTrigger>
          <TabsTrigger value="slicers">Slicers</TabsTrigger>
        </TabsList>

        <TabsContent value="pdfs" className="mt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pdfs.map((pdf) => (
                <TableRow key={pdf.id}>
                  <TableCell>{pdf.file_name}</TableCell>
                  <TableCell>{pdf.created_at ? pdf.created_at.toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>
                    <Link href={`/studio/${pdf.id}`} className="text-blue-600 hover:underline">
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