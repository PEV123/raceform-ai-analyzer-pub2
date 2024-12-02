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
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current;
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    };

    // Only scroll if there are messages
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]); // Only trigger when the number of messages changes

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