import { Document, Page, pdfjs } from "react-pdf";
import { useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Spinner } from "@/app/components/ui/spinner";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


interface PDFRendererProps {
  url: string;
  pageNumber: number;
  onDocumentLoadSuccess: (document: pdfjs.PDFDocumentProxy) => void;
  onPageRenderSuccess: (page: any) => void;
  skippedPages: number[];
  password: string | null;
}

function PDFRenderer({
  url,
  pageNumber,
  onDocumentLoadSuccess,
  onPageRenderSuccess,
  skippedPages,
  password: initialPassword,
}: PDFRendererProps) {
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [password, setPassword] = useState<string | null>(initialPassword);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  const handleLoadError = (error: Error) => {
    console.error("Error loading PDF:", error);
    if (error.name === "PasswordException") {
      setShowPasswordPrompt(true);
    } else {
      setLoadError(error);
    }
  };

  const fileProperties = useMemo(() => {
    return {
      url,
      password,
    };
  }, [url, password]);

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowPasswordPrompt(false);
    // This will trigger a re-render with the new password
  };

  if (showPasswordPrompt) {
    return (
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <Alert>
          <AlertDescription>
            This PDF is password protected. Please enter the password to view it.
          </AlertDescription>
        </Alert>
        <Input
          type="password"
          placeholder="Enter PDF password"
          value={password || ""}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit">Submit</Button>
      </form>
    );
  }

  return (
    <div className="relative">
      {loadError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load PDF. Please check the file and try again.
          </AlertDescription>
        </Alert>
      ) : (
        <Document
          file={fileProperties}
            onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={handleLoadError}
          loading={<Spinner />}
          className="overflow-y-hidden"
        >
          <Page
            pageNumber={pageNumber}
            onRenderSuccess={onPageRenderSuccess}
            renderTextLayer={false}
            renderAnnotationLayer={false}
              loading={<Spinner />}
            />
            {skippedPages.includes(pageNumber) && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900/70">
                <p className="max-w-[50%] text-center text-xl font-semibold text-white">
                  This page is excluded from processing. Toggle this page to include it in processing.
                </p>
              </div>
            )}
        </Document>
      )}
    </div>
  );
}

export default PDFRenderer;
