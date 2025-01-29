"use client";

import CreateSlicerDrawer from "@/app/components/create-slicer-drawer";
import { LoginRequiredMessage } from "@/app/components/login-required-message";
import PDFNavigation from "@/app/components/pdf-navigation";
import PDFViewer from "@/app/components/pdf-viewer";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/app/components/ui/breadcrumb";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Separator } from "@/app/components/ui/separator";
import { Skeleton } from "@/app/components/ui/skeleton";
import { usePDFViewer } from "@/app/contexts/pdf-viewer-context";
import { useAuth } from "@/app/hooks/use-auth";
import { toast } from "@/app/hooks/use-toast";
import { getAllSlicers, getPdfDetails, getSlicerDetails, linkPdfToSlicer } from "@/server/actions/studio/actions";
import { Tables } from "@/types/supabase-types/database.types";
import { AlertCircle, Calendar, FileText, Settings } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  const [slicerDetails, setSlicerDetails] = useState<Tables<"slicers"> | null>(null);
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
              setSlicerDetails(slicerData.slicerDetails as unknown as Tables<"slicers">);
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
          <div className="w-[400px] p-6">
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
            {/* <Button
              variant="outline"
              size="sm"
              onClick={handleConfigureSlicer}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configure Slicer
            </Button> */}
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
                  onRectangleUpdate={() => console.log("Rectangle updated")}
                  onClearPage={() => console.log("Page cleared")}
                  onClearAllPages={() => console.log("All pages cleared")}
                  url={pdfUrl}
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

          {/* Right Column - PDF Metadata */}
          <aside className="w-[400px] border-l border-border overflow-y-auto">
            <div className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">PDF Information</CardTitle>
                  <CardDescription>Details about the uploaded PDF</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">File Name</p>
                      <p className="text-sm text-muted-foreground">{pdfDetails.file_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Upload Date</p>
                      <p className="text-sm text-muted-foreground">
                        {pdfDetails.created_at ? new Date(pdfDetails.created_at).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Status</p>
                        <Badge variant={pdfDetails.file_processing_status === "processed" ? "default" : "secondary"}>
                          {pdfDetails.file_processing_status || "Not Processed"}
                        </Badge>
                      </div>
                      {pdfDetails.is_template && (
                        <Badge variant="outline" className="mt-1">Template</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {hasSlicers ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Associated Slicer</CardTitle>
                    <CardDescription>Currently linked slicer details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {slicerDetails && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{slicerDetails.name}</p>
                        <p className="text-sm text-muted-foreground">{slicerDetails.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center space-y-4">
                  <h2 className="text-lg font-medium text-foreground">No Slicer Configured</h2>
                  <p className="text-sm text-muted-foreground">
                    Configure a slicer to process and analyze your PDF content.
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
              )}
            </div>
          </aside>
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