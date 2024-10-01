import { PDFViewerProvider } from "@/app/contexts/pdf-viewer-context";
import React from "react";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PDFViewerProvider>
      {children}
    </PDFViewerProvider>
  );
}