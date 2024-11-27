import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const AdminSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [systemPrompt, setSystemPrompt] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .single();

      if (error) throw error;
      
      // Update local state with fetched values
      setSystemPrompt(data.system_prompt);
      setKnowledgeBase(data.knowledge_base);
      
      return data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("admin_settings")
        .update({
          system_prompt: systemPrompt,
          knowledge_base: knowledgeBase,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSettings"] });
      toast({
        title: "Settings Updated",
        description: "Admin settings have been successfully updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">System Prompt</label>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Enter the system prompt for the AI..."
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Knowledge Base</label>
          <Textarea
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value)}
            placeholder="Enter the knowledge base content..."
            className="min-h-[200px]"
          />
        </div>

        <Button 
          onClick={() => updateSettings.mutate()}
          disabled={updateSettings.isPending}
        >
          {updateSettings.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};