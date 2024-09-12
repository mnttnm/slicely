'use client';
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { FileText, MessageSquare } from 'lucide-react';
import ChatComponent from './ChatComponent';
import ProcessedOutputComponent from './ProcessedOutputComponent';

const PDFLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('processed-output');
  const [processedOutput, setProcessedOutput] = useState('Your processed output will appear here.');

  return (
    <Tabs className="w-1/2 flex flex-col h-[100%]" value={activeTab} onValueChange={setActiveTab}>
      <header className="flex justify-between items-center p-2">
        <h2 className="text-2xl">PDF Lab</h2>
      </header>
      <main className="flex-1 p-2">
        <TabsContent value="processed-output" className="h-full">
          <ProcessedOutputComponent content={processedOutput} />
        </TabsContent>
        <TabsContent value="chat" className="h-full">
          <ChatComponent onProcessedOutput={setProcessedOutput} />
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
