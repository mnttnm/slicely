"use client";

interface ChatMessageProps {
  role: string;
  content: string;
}

const ChatMessage = ({ role, content }: ChatMessageProps) => {
  return (
    <div className={`p-4 rounded-lg mb-4 ${role === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-900"}`}>
      <p className="font-semibold mb-2">{role === "user" ? "You" : "Assistant"}</p>
      <p className="whitespace-pre-wrap">{content}</p>
    </div>
  );
};

export default ChatMessage;