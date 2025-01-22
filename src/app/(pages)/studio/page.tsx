"use client";

import CreateSlicerDrawer from "@/app/components/create-slicer-drawer";
import { Slicer } from "@/app/components/slicer";
import { Button } from "@/app/components/ui/button";
import { EmptyPlaceholder } from "@/app/components/ui/empty-placeholder";
import { StudioSkeleton } from "@/app/components/ui/skeleton-studio";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import UploadButton from "@/app/components/upload-button";
import { useUser } from "@/app/hooks/use-user";
import { getSlicers, getUserPDFs } from "@/server/actions/studio/actions";
import { Tables } from "@/types/supabase-types/database.types";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const StudioPageContent = () => {
  const [activeTab, setActiveTab] = useState<string>("slicers");
  const [pdfs, setPdfs] = useState<(Tables<"pdfs"> & { slicer_ids: string[] })[]>([]);
  const [slicers, setSlicers] = useState<Tables<"slicers">[]>([]);
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCreatingSlicer, setIsCreatingSlicer] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [fetchedPDFs, fetchedSlicers] = await Promise.all([
        getUserPDFs(),
        getSlicers()
      ]);
      setPdfs(fetchedPDFs);
      setSlicers(fetchedSlicers);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

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

  const handleCreateSlicer = () => {
    setIsCreatingSlicer(true);
  };

  if (userLoading || isLoading) {
    return <StudioSkeleton />;
  }

  if (!user) {
    return <div>Please log in to access the Studio.</div>;
  }

  return (
    <div className="p-4 h-full overflow-hidden flex flex-col">
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col overflow-hidden">
        <TabsList className="self-start">
          <TabsTrigger value="slicers">Slicers</TabsTrigger>
          <TabsTrigger value="pdfs">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="pdfs" className="mt-2 overflow-hidden flex flex-col w-full">
          {pdfs.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <EmptyPlaceholder
                title="No PDF Files"
                description="Upload PDF files to start creating slicers and extracting insights."
                icon="📄"
              >
                <UploadButton
                  onSuccess={handleUploadSuccess}
                  buttonText="Upload PDF"
                  accept=".pdf"
                  isTemplate={false}
                  variant="default"
                />
              </EmptyPlaceholder>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader>
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
                    <TableRow key={pdf.id}>
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
            </div>
          )}
        </TabsContent>
        <TabsContent value="slicers">
          {slicers.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <EmptyPlaceholder
                title="No Slicers Created"
                description="Create a slicer to start processing your PDF files and extracting insights."
                icon="✂️"
              >
                <Button onClick={handleCreateSlicer}>Create Slicer</Button>
              </EmptyPlaceholder>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slicers.map((slicer) => (
                <Slicer key={slicer.id} id={slicer.id} fileName={slicer.name} pdf_password={slicer.pdf_password} description={slicer.description ?? ""} />
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

const StudioPage = () => {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center">Loading...</div>}>
      <StudioPageContent />
    </Suspense>
  );
};

export default StudioPage;