import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { SiteSettings } from "./settings/SiteSettings";
import { AISettings } from "./settings/AISettings";
import { SystemPromptSettings } from "./settings/SystemPromptSettings";

export const AdminSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [systemPrompt, setSystemPrompt] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("anthropic");
  const [anthropicModel, setAnthropicModel] = useState("claude-3-sonnet-20240229");
  const [openaiModel, setOpenaiModel] = useState("gpt-4o");
  const [siteName, setSiteName] = useState("OddsOracle");
  const [raceTitleTemplate, setRaceTitleTemplate] = useState("[date] [venue] [time] [racename] | [sitename]");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      console.log("Fetching admin settings...");
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .single();

      if (error) {
        console.error("Error fetching settings:", error);
        throw error;
      }
      
      console.log("Fetched settings:", data);
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      console.log("Updating form with settings:", settings);
      setSystemPrompt(settings.system_prompt || "");
      setKnowledgeBase(settings.knowledge_base || "");
      setSelectedProvider(settings.selected_provider || "anthropic");
      setAnthropicModel(settings.anthropic_model || "claude-3-sonnet-20240229");
      setOpenaiModel(settings.openai_model || "gpt-4o");
      setSiteName(settings.site_name || "OddsOracle");
      setRaceTitleTemplate(settings.race_title_template || "[date] [venue] [time] [racename] | [sitename]");
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async () => {
      console.log("Updating settings with values:", {
        systemPrompt,
        knowledgeBase,
        selectedProvider,
        anthropicModel,
        openaiModel,
        siteName,
        raceTitleTemplate
      });

      const { error } = await supabase
        .from("admin_settings")
        .update({
          system_prompt: systemPrompt,
          knowledge_base: knowledgeBase,
          selected_provider: selectedProvider,
          anthropic_model: anthropicModel,
          openai_model: openaiModel,
          site_name: siteName,
          race_title_template: raceTitleTemplate,
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
    <div className="space-y-6">
      <SiteSettings
        siteName={siteName}
        raceTitleTemplate={raceTitleTemplate}
        onSiteNameChange={setSiteName}
        onRaceTitleTemplateChange={setRaceTitleTemplate}
      />
      
      <SystemPromptSettings
        systemPrompt={systemPrompt}
        knowledgeBase={knowledgeBase}
        onSystemPromptChange={setSystemPrompt}
        onKnowledgeBaseChange={setKnowledgeBase}
      />
      
      <AISettings
        selectedProvider={selectedProvider}
        anthropicModel={anthropicModel}
        openaiModel={openaiModel}
        onProviderChange={setSelectedProvider}
        onAnthropicModelChange={setAnthropicModel}
        onOpenAIModelChange={setOpenaiModel}
      />

      <Button 
        onClick={() => updateSettings.mutate()}
        disabled={updateSettings.isPending}
      >
        {updateSettings.isPending ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
};