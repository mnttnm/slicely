import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { FileText, MessageSquare, MoreVertical, Settings, Download, Database } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

const PDFLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('processed-output');

  const tabContent = {
    'create-slicer': <div>Create Slicer Content</div>,
    'processed-output': <div>Processed Output Content</div>,
    'chat': <div>Chat Content</div>,
    'export': <div>Export Content</div>,
    'save-to-db': <div>Save to DB Content</div>,
  };

  return (
    <Tabs className="w-1/2 flex flex-col h-[100%]" value={activeTab} onValueChange={setActiveTab}>
      <header className="flex justify-between items-center p-2">
        <h2 className="text-2xl">PDF Lab</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setActiveTab('create-slicer')}>
              <Settings className="mr-2 h-4 w-4" />
              Create Slicer
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setActiveTab('export')}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setActiveTab('save-to-db')}>
              <Database className="mr-2 h-4 w-4" />
              Save to DB
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex-1 p-2">
        <TabsContent value={activeTab}>
          {tabContent[activeTab as keyof typeof tabContent]}
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
