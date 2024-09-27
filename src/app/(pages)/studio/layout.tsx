import { PDFViewerProvider } from "@/app/contexts/pdf-viewer-context";

const StudioLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <PDFViewerProvider>
      <div className="flex flex-col h-full">
        {children}
      </div>
    </PDFViewerProvider>
  );
};

export default StudioLayout;