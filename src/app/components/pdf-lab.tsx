"use client";
import ProcessedOutput from "@/app/components/processed-output";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Tables } from "@/types/supabase-types/database.types";
import { FileText, MessageSquare } from "lucide-react";
import React, { useState } from "react";
import ChatComponent from "./chat-component";

const PDFLab: React.FC<{ pdfDetails: Tables<"pdfs">; slicerIds: string[] }> = ({ pdfDetails, slicerIds }) => {
  const [activeTab, setActiveTab] = useState("processed-output");

  return (
    <Tabs className="flex flex-col h-[100%]" value={activeTab} onValueChange={setActiveTab}>
      {/* <header className="flex justify-between items-center p-2">
        <h2 className="text-2xl">PDF Lab</h2>
      </header> */}
      <main className="flex-1 p-2">
        <TabsContent value="processed-output" className="h-full">
          <ProcessedOutput pdfDetails={pdfDetails} slicerIds={slicerIds} />
        </TabsContent>
        <TabsContent value="chat" className="h-full">
          <ChatComponent />
        </TabsContent>
      </main>
      <TabsList className="h-[3rem] border-t border-gray-600/30">
        <TabsTrigger value="processed-output" className="flex-1 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Processed Output
          </Button>
        </TabsTrigger>
        <TabsTrigger value="chat" className="flex-1 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </Button>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default PDFLab;
