"use client";

import CreateSlicerDrawer from "@/app/components/create-slicer-drawer";
import { LoginDialog } from "@/app/components/login-dialog";
import { Slicer } from "@/app/components/slicer";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/app/components/ui/card";
import { EmptyPlaceholder } from "@/app/components/ui/empty-placeholder";
import { StudioSkeleton } from "@/app/components/ui/skeleton-studio";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import UploadButton from "@/app/components/upload-button";
import { useUser } from "@/app/hooks/use-user";
import { getSlicers, getUserPDFs } from "@/server/actions/studio/actions";
import { Tables } from "@/types/supabase-types/database.types";
import { Plus } from "lucide-react";
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
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);


  const PlaceholderSlicer = ({ onClick }: { onClick: () => void }) => {
    return (
      <div onClick={onClick} className="cursor-pointer">
        <Card className="relative bg-gradient-to-b from-background/50 to-background border-border/40 hover:border-border/80 hover:shadow-lg transition-all duration-300 ease-in-out overflow-hidden group h-[200px]">
          <CardHeader className="relative p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2.5 bg-muted rounded-xl group-hover:bg-muted/80 transition-colors">
                <Plus className="h-5 w-5 text-muted-foreground/70" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-medium text-foreground/90">
                  Create New Slicer
                </CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {user ? "Create a new slicer to process PDFs and get AI-powered insights." : "Sign in to create and manage your own slicers."}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [fetchedPDFs, fetchedSlicers] = await Promise.all([
        getUserPDFs(),
        getSlicers()
      ]);
      setPdfs(fetchedPDFs);
      setSlicers(fetchedSlicers);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
      setHasInitialized(true);
    }
  };

  useEffect(() => {
    // Only fetch data once the user loading state is complete
    if (!userLoading) {
      fetchData();
    }
  }, [userLoading]);

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
    if (!user) {
      setIsLoginDialogOpen(true);
      return;
    }
    setIsCreatingSlicer(true);
  };

  const handleUploadClick = () => {
    if (!user) {
      setIsLoginDialogOpen(true);
      return;
    }
  };

  // Show loading state while initializing or loading user
  if (userLoading || !hasInitialized) {
    return <StudioSkeleton />;
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyPlaceholder
          title="Error"
          description={error}
          icon="⚠️"
        >
          <Button onClick={fetchData}>Retry</Button>
        </EmptyPlaceholder>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center py-1">
        <h1 className="text-xl">Studio</h1>
        <div className="flex gap-2">
          <div className="flex gap-2">
            {/* let's not show upload pdf on the studio, we will only have it on the slicer page */}
            {/* <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <UploadButton
                      onSuccess={handleUploadSuccess}
                      buttonText="Upload PDF"
                      accept=".pdf"
                      isTemplate={false}
                      variant={activeTab === "pdfs" ? "default" : "outline"}
                      disabled={!user}
                    />
                  </div>
                </TooltipTrigger>
                {!user && (
                  <TooltipContent>
                    <p className="text-sm">Please login to upload PDFs</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider> */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant={activeTab === "slicers" ? "default" : "outline"}
                      onClick={handleCreateSlicer}
                      disabled={!user}
                    >
                      Create Slicer
                    </Button>
                  </div>
                </TooltipTrigger>
                {!user && (
                  <TooltipContent>
                    <p className="text-sm">Please login to create slicers</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {isLoading ? (
        <StudioSkeleton />
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col overflow-hidden">
            <TabsList className="self-start bg-background/50 backdrop-blur-sm border border-border/40 rounded-lg p-1 hover:border-border/60 transition-colors duration-300">
              <TabsTrigger value="slicers" className="px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-muted/40 transition-all duration-200">Slicers</TabsTrigger>
              <TabsTrigger value="pdfs" className="px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-muted/40 transition-all duration-200">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="pdfs" className="mt-2 overflow-hidden flex flex-col w-full">
            {pdfs.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <EmptyPlaceholder
                  title="No PDF Files"
                  description={user ? "Upload PDF files to start creating slicers and extracting insights." : "These are demo files to help you understand how Slicely works."}
                  icon="📄"
                >
                  {user ? (
                    <UploadButton
                      onSuccess={handleUploadSuccess}
                      buttonText="Upload PDF"
                      accept=".pdf"
                      isTemplate={false}
                      variant="default"
                    />
                  ) : null}
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
                        <TableCell className="font-medium text-foreground">{pdf.file_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {pdf.created_at ? new Date(pdf.created_at).toLocaleString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          {pdf.slicer_ids && pdf.slicer_ids.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {pdf.slicer_ids.map((slicer_id) => {
                                const slicer = slicers.find(s => s.id === slicer_id);
                                return (
                                  <Link
                                    key={slicer_id}
                                    href={`/studio/slicers/${slicer_id}`}
                                    className="text-primary hover:text-primary/80 transition-colors duration-200 capitalize"
                                  >
                                    {slicer?.name || "Unnamed Slicer"}
                                  </Link>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={pdf.is_template ? "default" : "secondary"}
                            className="font-normal"
                          >
                            {pdf.is_template ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="hover:text-primary transition-colors duration-200"
                          >
                            <Link href={`/studio/pdfs/${pdf.id}`}>
                              View
                            </Link>
                          </Button>
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
                  description={user ? "Create a slicer to start processing your PDF files and extracting insights." : "These are demo slicers to help you understand how Slicely works."}
                  icon="✂️"
                >
                  {user && (
                    <Button onClick={handleCreateSlicer}>Create Slicer</Button>
                  )}
                </EmptyPlaceholder>
              </div>
            ) : (
              // Replace the existing placeholder card with the new component:
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...slicers].sort((a, b) => {
                          if (a.is_seeded_data && !b.is_seeded_data) return -1;
                          if (!a.is_seeded_data && b.is_seeded_data) return 1;
                          return 0;
                        }).map((slicer) => (
                          <Slicer
                            key={slicer.id}
                            id={slicer.id}
                            total_pdfs={pdfs.filter((pdf) => pdf.slicer_ids?.includes(slicer.id)).length}
                            fileName={slicer.name}
                            pdf_password={slicer.pdf_password}
                            description={slicer.description ?? ""}
                            isSeeded={slicer.is_seeded_data ?? false}
                          />
                      ))}
                      {slicers.length < 2 && (
                        <PlaceholderSlicer onClick={handleCreateSlicer} />
                      )}
                    </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      {isCreatingSlicer && (
        <CreateSlicerDrawer open={isCreatingSlicer} onOpenChange={setIsCreatingSlicer} />
      )}
      <LoginDialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen} />
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