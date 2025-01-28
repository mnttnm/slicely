"use client";

import CreateSlicerDrawer from "@/app/components/create-slicer-drawer";
import { LoginRequiredMessage } from "@/app/components/login-required-message";
import PDFLab from "@/app/components/pdf-lab";
import PDFNavigation from "@/app/components/pdf-navigation";
import PDFViewer from "@/app/components/pdf-viewer";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/app/components/ui/breadcrumb";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Skeleton } from "@/app/components/ui/skeleton";
import { usePDFViewer } from "@/app/contexts/pdf-viewer-context";
import { useAuth } from "@/app/hooks/use-auth";
import { toast } from "@/app/hooks/use-toast";
import { getAllSlicers, getPdfDetails, getSlicerDetails, linkPdfToSlicer } from "@/server/actions/studio/actions";
import { Tables } from "@/types/supabase-types/database.types";
import { AlertCircle, Database, Download, MoreVertical, Settings } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const { isAuthenticated } = useAuth();

  const processingRules = useMemo(() => ({
    annotations: [],
    pageSelection: {
      strategy: "include" as const,
      rules: [{ type: "all" as const }],
    },
  }), []);

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
            if (allSlicers) {
              setExistingSlicers(allSlicers);
            }
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
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to save to database.",
        variant: "destructive",
      });
      return;
    }
    console.log("Save to DB");
  };

  const handleCreateNewSlicer = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to create a new slicer.",
        variant: "destructive",
      });
      return;
    }
    setIsDialogOpen(false);
    setIsCreateSlicerDrawerOpen(true);
  };

  const handleSelectExistingSlicer = (slicerId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to select a slicer.",
        variant: "destructive",
      });
      return;
    }
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

  const handleRectangleUpdate = useCallback(() => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to make annotations.",
        variant: "destructive",
      });
      return;
    }
    console.log("Rectangle updated");
  }, [isAuthenticated]);

  const handleClearPage = useCallback(() => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to clear pages.",
        variant: "destructive",
      });
      return;
    }
    console.log("Clear page");
  }, [isAuthenticated]);

  const handleClearAllPages = useCallback(() => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to clear all pages.",
        variant: "destructive",
      });
      return;
    }
    console.log("Clear all pages");
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-border">
          <div className="flex h-full items-center justify-between px-4">
            <Skeleton className="h-5 w-[200px]" />
            <Skeleton className="h-9 w-[150px]" />
          </div>
        </header>
        <div className="flex-1 flex">
          <div className="flex-1 border-r border-border">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="flex-1 p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-[200px]" />
              <Skeleton className="h-4 w-[300px]" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading PDF</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!pdfUrl || !pdfDetails) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No PDF Data</AlertTitle>
          <AlertDescription>
            Could not load the PDF data. Please make sure the PDF exists and you have permission to access it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-10 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center justify-between px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => router.push("/studio")} className="text-sm">
                  Studio
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => router.push("/studio?tab=pdfs")} className="text-sm">
                  PDFs
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm truncate max-w-[200px]" title={pdfDetails?.file_name}>
                  {pdfDetails?.file_name || "PDF Details"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleConfigureSlicer}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configure Slicer
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
        </div>
      </header>
      <main className="flex-1 bg-background flex flex-col min-h-0">
        <div className="flex-1 flex min-h-0">
          {/* Left Column - PDF Viewer */}
          <div className="relative flex-1 border-r border-border">
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1">
                <PDFViewer
                  pdf_password={pdfPassword}
                  showToolbar={false}
                  url={pdfUrl}
                  onRectangleUpdate={handleRectangleUpdate}
                  onClearPage={handleClearPage}
                  onClearAllPages={handleClearAllPages}
                  processingRules={processingRules}
                />
              </div>
              <div className="border-t border-border p-2">
                <PDFNavigation
                  currentPage={pageNumber ?? 1}
                  numPages={numPages ?? 1}
                  onPageChange={jumpToPage}
                />
              </div>
            </div>
          </div>

          {/* Right Column - PDF Lab/Configuration */}
          <div className="flex-1 flex flex-col min-w-[500px] max-w-[50%]">
            {hasSlicers ? (
              <div className="flex-1 overflow-auto">
                <PDFLab pdfDetails={pdfDetails} slicerIds={slicerIds ?? []} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full flex-col gap-4 p-6">
                <div className="text-center space-y-4 max-w-md">
                  <h2 className="text-lg font-medium text-foreground">Configure Your PDF Slicer</h2>
                  <p className="text-sm text-muted-foreground">
                    Set up a slicer to process and analyze your PDF content efficiently.
                  </p>
                  {!isAuthenticated && (
                    <LoginRequiredMessage
                      title="Login to Configure Slicer"
                      description="You need to be logged in to configure slicers."
                      className="mt-6"
                    />
                  )}
                  <Button
                    onClick={handleConfigureSlicer}
                    className="mt-4"
                    size="lg"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Slicer
                  </Button>
                </div>
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