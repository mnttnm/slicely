import { CommandMenu } from "@/app/components/command-menu";
import { Header } from "@/app/components/header";
import { ThemeProvider } from "@/app/components/theme-provider";
import { Toaster } from "@/app/components/ui/toaster";
import { PDFProvider } from "@/app/contexts/pdf-context";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="flex flex-col h-full overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PDFProvider>
            <Header />
            <main className="flex-1 min-h-0 flex flex-col">
              {children}
            </main>
            <CommandMenu />
            <Toaster />
          </PDFProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}