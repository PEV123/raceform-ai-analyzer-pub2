import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIMEZONES = [
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const ANTHROPIC_MODELS = [
  "claude-3-sonnet-20240229",
  "claude-3-5-sonnet-20241022",
  "claude-3-haiku-20240307",
];

const OPENAI_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
];

const PROVIDERS = [
  "anthropic",
  "openai",
];

export const AdminSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [systemPrompt, setSystemPrompt] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [timezone, setTimezone] = useState("Europe/London");
  const [selectedProvider, setSelectedProvider] = useState("anthropic");
  const [anthropicModel, setAnthropicModel] = useState("claude-3-sonnet-20240229");
  const [openaiModel, setOpenaiModel] = useState("gpt-4o");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .single();

      if (error) throw error;
      
      setSystemPrompt(data.system_prompt);
      setKnowledgeBase(data.knowledge_base);
      setTimezone(data.timezone);
      setSelectedProvider(data.selected_provider);
      setAnthropicModel(data.anthropic_model);
      setOpenaiModel(data.openai_model);
      
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
          timezone: timezone,
          selected_provider: selectedProvider,
          anthropic_model: anthropicModel,
          openai_model: openaiModel,
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

        <div className="space-y-2">
          <label className="text-sm font-medium">AI Provider</label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger>
              <SelectValue placeholder="Select AI provider" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProvider === 'anthropic' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Anthropic Model</label>
            <Select value={anthropicModel} onValueChange={setAnthropicModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select Anthropic model" />
              </SelectTrigger>
              <SelectContent>
                {ANTHROPIC_MODELS.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedProvider === 'openai' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">OpenAI Model</label>
            <Select value={openaiModel} onValueChange={setOpenaiModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select OpenAI model" />
              </SelectTrigger>
              <SelectContent>
                {OPENAI_MODELS.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Timezone</label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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