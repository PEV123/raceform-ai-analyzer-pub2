import { Message } from "./types/chat";
import { MessageDisplay } from "./MessageDisplay";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export const ChatMessageList = ({ messages, isLoading }: ChatMessageListProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
      {messages.map((msg, index) => (
        <MessageDisplay key={index} role={msg.role} message={msg.message} />
      ))}
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
    </ScrollArea>
  );
};