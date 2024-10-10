"use client";

interface ChatMessageProps {
  role: string;
  content: string;
}

const ChatMessage = ({ role, content }: ChatMessageProps) => {
  return (
    <div className={`p-2 rounded-lg ${role === "user" ? "bg-gray-800 text-white" : "bg-gray-300 text-black"}`}>
      <p className="font-semibold">{role === "user" ? "You" : "Assistant"}</p>
      <p>{content}</p>
    </div>
  );
};

export default ChatMessage;