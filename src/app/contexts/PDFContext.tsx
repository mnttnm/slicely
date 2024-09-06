'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PDF {
  id: string;
  name: string;
  url: string;
  uploadDate: Date;
}

interface PDFContextType {
  pdfs: PDF[];
  addPDF: (pdf: PDF) => void;
  currentPDF: PDF | null;
  setCurrentPDF: (pdf: PDF | null) => void;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

export const PDFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pdfs, setPDFs] = useState<PDF[]>([]);
  const [currentPDF, setCurrentPDF] = useState<PDF | null>(null);

  useEffect(() => {
    // Load PDFs and currentPDF from local storage on component mount
    const storedPDFs = localStorage.getItem('pdfs');
    const storedCurrentPDF = localStorage.getItem('currentPDF');
    if (storedPDFs) {
      setPDFs(JSON.parse(storedPDFs).map((pdf: PDF) => ({
        ...pdf,
        uploadDate: new Date(pdf.uploadDate)
      })));
    }
    if (storedCurrentPDF) {
      setCurrentPDF(JSON.parse(storedCurrentPDF));
    }
  }, []);

  const addPDF = (pdf: PDF) => {
    const updatedPDFs = [...pdfs, pdf];
    setPDFs(updatedPDFs);
    localStorage.setItem('pdfs', JSON.stringify(updatedPDFs));
  };

  const updateCurrentPDF = (pdf: PDF | null) => {
    setCurrentPDF(pdf);
    localStorage.setItem('currentPDF', JSON.stringify(pdf));
  };

  return (
    <PDFContext.Provider value={{ pdfs, addPDF, currentPDF, setCurrentPDF: updateCurrentPDF }}>
      {children}
    </PDFContext.Provider>
  );
};

export const usePDFContext = () => {
  const context = useContext(PDFContext);
  if (context === undefined) {
    throw new Error('usePDFContext must be used within a PDFProvider');
  }
  return context;
};