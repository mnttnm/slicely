'use client';

import React, { useState } from 'react';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatComponentProps {
  onProcessedOutput: (output: string) => void;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ onProcessedOutput }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input }]);
      // Here you would typically send the message to your backend
      // and then add the response to the messages
      setInput('');

      // Simulating a response that updates the processed output
      setTimeout(() => {
        const assistantMessage = `Processed: ${input}`;
        setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
        onProcessedOutput(assistantMessage);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow p-4">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
              {message.content}
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend}>Send</Button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
