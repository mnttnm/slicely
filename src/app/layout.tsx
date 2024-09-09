import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/app/components/Header";
import { PDFProvider } from '@/app/contexts/PDFContext';
import { CommandMenu } from "@/app/components/CommandMenu";
import { Toaster } from "@/app/components/ui/toaster";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "PDF Made Easy",
  description: "Annotate, Process and Parse just the content that you need",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans overflow-hidden h-full`}>
        <PDFProvider>
          <div className="flex flex-col h-screen">
            <Header />
            {children}
            <CommandMenu />
            <Toaster />
          </div>
        </PDFProvider>
      </body>
    </html>
  );
}
