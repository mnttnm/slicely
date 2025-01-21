"use client";

import CreateSlicerDrawer from "@/app/components/create-slicer-drawer";
import PDFLab from "@/app/components/pdf-lab";
import PDFNavigation from "@/app/components/pdf-navigation";
import PDFViewer from "@/app/components/pdf-viewer";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/app/components/ui/breadcrumb";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { usePDFViewer } from "@/app/contexts/pdf-viewer-context";
import { getAllSlicers, getPdfDetails, getSlicerDetails, linkPdfToSlicer } from "@/server/actions/studio/actions";
import { Tables } from "@/types/supabase-types/database.types";
import { Database, Download, MoreVertical, Settings } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PDFDetails = () => {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfDetails, setPdfDetails] = useState<Tables<"pdfs"> | null>(null);
  const [slicerIds, setSlicerIds] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfPassword, setPdfPassword] = useState<string | undefined>(undefined);
  const [hasSlicers, setHasSlicers] = useState<boolean>(false);
  const [existingSlicers, setExistingSlicers] = useState<Tables<"slicers">[]>([]);
  const [selectedSlicerId, setSelectedSlicerId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateSlicerDrawerOpen, setIsCreateSlicerDrawerOpen] = useState(false);
  const router = useRouter();

  const { numPages, pageNumber, jumpToPage } = usePDFViewer();

  useEffect(() => {
    const fetchPdfDetails = async () => {
      if (!id || typeof id !== "string") return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await getPdfDetails(id);
        if (result) {
          const { pdfDetails, pdfUrl, slicer_ids } = result;
          setPdfDetails(pdfDetails);
          setPdfUrl(pdfUrl);
          setSlicerIds(slicer_ids);
          setHasSlicers(slicer_ids.length > 0);

          if (slicer_ids.length > 0) {
            const slicerData = await getSlicerDetails(slicer_ids[0]);
            if (slicerData) {
              setPdfPassword(slicerData.slicerDetails?.pdf_password ?? undefined);
            }
          } else {
            const allSlicers = await getAllSlicers();
            setExistingSlicers(allSlicers);
          }
        }
      } catch (err) {
        console.error("Error fetching PDF details:", err);
        setError("Failed to fetch PDF details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdfDetails();
  }, [id]);

  const handleSaveToDB = () => {
    console.log("Save to DB");
  };

  const handleCreateNewSlicer = () => {
    setIsDialogOpen(false);
    setIsCreateSlicerDrawerOpen(true);
  };

  const handleSelectExistingSlicer = (slicerId: string) => {
    setSelectedSlicerId(slicerId);
  };

  const handleConfigureSlicer = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedSlicerId(null);
  };

  const handleDialogDone = async () => {
    if (selectedSlicerId) {
      try {
        await linkPdfToSlicer(selectedSlicerId, id as string);
        router.refresh();
      } catch (error) {
        console.error("Error linking PDF to slicer:", error);
        setError("Failed to link PDF to slicer. Please try again.");
      }
    }
    setIsDialogOpen(false);
  };

  const handleCreateSlicerComplete = async (newSlicerId: string) => {
    try {
      await linkPdfToSlicer(newSlicerId, id as string);
      router.refresh();
    } catch (error) {
      console.error("Error linking PDF to new slicer:", error);
      setError("Failed to link PDF to new slicer. Please try again.");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!pdfUrl || !pdfDetails) {
    return <div>No data available</div>;
  }

  return (
    <>
      <header className="h-[3rem] px-4 py-2 flex-shrink-0 flex-grow-0 border-b border-gray-600/30 flex justify-between items-center">
        <div className="w-1/3"></div>
        <Breadcrumb className="flex-1 flex justify-center">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push("/studio")}>
                Studio
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push("/studio?tab=pdfs")}>
                PDFs
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate max-w-xs" title={pdfDetails?.file_name}>
                {pdfDetails?.file_name || "PDF Details"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="w-1/3 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleConfigureSlicer}>
                <Settings className="mr-2 h-4 w-4" />
                Configure Slicer
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => { console.log("Export"); }}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleSaveToDB}>
                <Database className="mr-2 h-4 w-4" />
                Save to DB
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 bg-gray-800 flex flex-col min-h-0 text-white">
        <div className="flex-1 flex min-h-0">
          <div className="relative flex-1">
            <PDFViewer
              pdf_password={pdfPassword}
              showToolbar={false}
              url={pdfUrl}
              onRectangleUpdate={() => {
                console.log("Rectangle updated");
              }}
              onClearPage={() => {
                console.log("Clear page");
              }}
              onClearAllPages={() => {
                console.log("Clear all pages");
              }}
              processingRules={{
                annotations: [],
                pageSelection: {
                  strategy: "include",
                  rules: [{ type: "all" }],
                },
              }}
            />
            <PDFNavigation
              currentPage={pageNumber ?? 1}
              numPages={numPages ?? 1}
              onPageChange={jumpToPage}
            />
          </div>
          <div className="flex-1">
            {hasSlicers ? (
              <PDFLab pdfDetails={pdfDetails} slicerIds={slicerIds ?? []} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Button onClick={handleConfigureSlicer}>Configure Slicer</Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Slicer</DialogTitle>
            <DialogDescription>
              Create a new slicer or select an existing one to associate with this PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Button onClick={handleCreateNewSlicer}>Create New Slicer</Button>
            {existingSlicers.length > 0 && (
              <div>
                <p className="mb-2 text-center">or</p>
                <Select onValueChange={handleSelectExistingSlicer}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an existing Slicer" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingSlicers.map((slicer) => (
                      <SelectItem key={slicer.id} value={slicer.id}>
                        {slicer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
            <Button onClick={handleDialogDone} disabled={!selectedSlicerId}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateSlicerDrawer
        open={isCreateSlicerDrawerOpen}
        onOpenChange={(open) => {
          setIsCreateSlicerDrawerOpen(open);
          if (!open) {
            router.refresh();
          }
        }}
        defaultName={`Slicer for ${pdfDetails.file_name}`}
        defaultDescription={`Slicer for ${pdfDetails.file_name}`}
        defaultFileId={id as string}
        onComplete={handleCreateSlicerComplete}
      />
    </>
  );
};

export default PDFDetails;