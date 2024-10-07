"use client";

import CreateSlicerDrawer from "@/app/components/create-slicer-drawer";
import { Slicer } from "@/app/components/slicer";
import { Button } from "@/app/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import UploadButton from "@/app/components/upload-button";
import { useUser } from "@/app/hooks/use-user";
import { getSlicers, getUserPDFs } from "@/server/actions/studio/actions";
import { Tables } from "@/types/supabase-types/database.types";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const StudioPage = () => {
  const [activeTab, setActiveTab] = useState<string>("slicers");
  const [pdfs, setPdfs] = useState<(Tables<"pdfs"> & { slicer_ids: string[] })[]>([]);
  const [slicers, setSlicers] = useState<Tables<"slicers">[]>([]);
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCreatingSlicer, setIsCreatingSlicer] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const fetchedPDFs = await getUserPDFs();
      const fetchedSlicers = await getSlicers();
      setPdfs(fetchedPDFs);
      setSlicers(fetchedSlicers);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "pdfs" || tab === "slicers") {
      setActiveTab(tab);
    } else if (pathname === "/studio") {
      router.push("/studio?tab=slicers");
    }
  }, [pathname, router, searchParams]);

  const handleUploadSuccess = () => {
    fetchData();
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/studio?tab=${value}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to access the Studio.</div>;
  }

  const handleCreateSlicer = () => {
    // initiate slicer creation
    // once success, change the active tab to slicers
    setIsCreatingSlicer(true);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center py-1">
        <h1 className="text-xl">Studio</h1>
        <div className="flex gap-2">
          <div className="flex gap-2">
            <UploadButton
              onSuccess={handleUploadSuccess}
              buttonText="Upload PDF"
              accept=".pdf"
              isTemplate={false}
              variant={activeTab === "pdfs" ? "default" : "outline"}
            />
            <Button variant={activeTab === "slicers" ? "default" : "outline"} onClick={handleCreateSlicer}>
              Create Slicer
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="slicers">Slicers</TabsTrigger>
          <TabsTrigger value="pdfs">Files</TabsTrigger>
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
                  <TableCell className="text-gray-500">{pdf.created_at ? new Date(pdf.created_at).toLocaleString() : "N/A"}</TableCell>
                  <TableCell className="text-gray-500">
                    {pdf.slicer_ids && pdf.slicer_ids.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {pdf.slicer_ids.map((slicer_id) => (
                          <Link key={slicer_id} href={`/studio/slicers/${slicer_id}`} className="text-gray-300 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                            {slicer_id}
                          </Link>
                        ))}
                      </div>
                    ) : "N/A"}
                  </TableCell>
                  <TableCell className="text-gray-500">{pdf.is_template ? "Yes" : "No"}</TableCell>
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
                <Slicer key={slicer.id} id={slicer.id} fileName={slicer.name} pdf_password={slicer.pdf_password} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      {isCreatingSlicer && (
        <CreateSlicerDrawer open={isCreatingSlicer} onOpenChange={setIsCreatingSlicer} />
      )}
    </div>
  );
};

export default StudioPage;