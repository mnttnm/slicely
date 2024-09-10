import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/app/components/Header";
import { PDFProvider } from '@/app/contexts/PDFContext';
import { CommandMenu } from "@/app/components/CommandMenu";
import { Toaster } from "@/app/components/ui/toaster";
import { ThemeProvider } from "@/app/components/ThemeProvider";

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
  title: "Slicely: PDF Made Easy",
  description: "Annotate, Process and Parse just the content that you need",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PDFProvider>
            <Header />
            <CommandMenu />
            {children}
            <Toaster />
          </PDFProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
