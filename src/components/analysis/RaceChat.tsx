import { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatInput } from "./ChatInput";
import { useRaceChat } from "@/hooks/useRaceChat";
import { ImageData } from "./types/chat";
import { ChatMessageList } from "./ChatMessageList";

interface RaceChatProps {
  raceId: string;
}

export const RaceChat = ({ raceId }: RaceChatProps) => {
  const { messages, isLoading, sendMessage, loadMessages } = useRaceChat(raceId);

  useEffect(() => {
    if (raceId) {
      console.log('Loading messages for race:', raceId);
      loadMessages();
    }
  }, [raceId, loadMessages]);

  const handleSendMessage = async (message: string, imageBase64?: { data: string; type: string }, excludeRaceDocuments?: boolean) => {
    if (!raceId) return;
    
    console.log('Sending message:', message, 'with image:', !!imageBase64, 'excluding race documents:', excludeRaceDocuments);
    
    const imageData: ImageData | undefined = imageBase64 ? {
      source: {
        type: "base64",
        media_type: imageBase64.type,
        data: imageBase64.data
      }
    } : undefined;
    
    await sendMessage(message, imageData, excludeRaceDocuments);
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="border-b p-2">
        <Tabs defaultValue="chat">
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ChatMessageList messages={messages} isLoading={isLoading} />
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};