import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { useSession } from '@supabase/auth-helpers-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RaceChatProps {
  raceId: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
}

export const RaceChat = ({ raceId }: RaceChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const session = useSession();
  const [chatMode, setChatMode] = useState<'personal' | 'all'>('personal');

  useEffect(() => {
    loadChatHistory();
  }, [raceId, chatMode]);

  const loadChatHistory = async () => {
    const query = supabase
      .from('race_chats')
      .select('*')
      .eq('race_id', raceId)
      .order('created_at', { ascending: true });

    // Filter by user_id for personal chat mode
    if (chatMode === 'personal' && session?.user) {
      query.eq('user_id', session.user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading chat history:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
      return;
    }

    setMessages(data.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      message: msg.message
    })));
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading || !session?.user) return;

    setIsLoading(true);
    const userMessage = newMessage.trim();
    setNewMessage("");

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-anthropic', {
        body: {
          message: userMessage,
          raceId,
          previousMessages: messages.map(m => ({
            role: m.role,
            content: m.message
          }))
        }
      });

      if (error) throw error;

      // Store both user and assistant messages with user_id
      const { error: insertError } = await supabase
        .from('race_chats')
        .insert([
          { 
            race_id: raceId, 
            message: userMessage, 
            role: 'user',
            user_id: session.user.id 
          },
          { 
            race_id: raceId, 
            message: data.message, 
            role: 'assistant',
            user_id: session.user.id 
          }
        ]);

      if (insertError) throw insertError;

      await loadChatHistory();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  if (!session?.user) {
    return (
      <div className="p-4 text-center">
        Please log in to use the chat feature.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="border-b p-2">
        <Tabs value={chatMode} onValueChange={(value) => setChatMode(value as 'personal' | 'all')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">My Chat</TabsTrigger>
            <TabsTrigger value="all">All Chats</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 ${
              msg.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-muted'
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}
      </ScrollArea>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
};