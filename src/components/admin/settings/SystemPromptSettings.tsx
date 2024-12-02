import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface SystemPromptSettingsProps {
  systemPrompt: string;
  knowledgeBase: string;
  onSystemPromptChange: (value: string) => void;
  onKnowledgeBaseChange: (value: string) => void;
}

export const SystemPromptSettings = ({
  systemPrompt,
  knowledgeBase,
  onSystemPromptChange,
  onKnowledgeBaseChange,
}: SystemPromptSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Prompt Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>System Prompt</Label>
          <Textarea
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            placeholder="Enter the system prompt for the AI..."
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label>Knowledge Base</Label>
          <Textarea
            value={knowledgeBase}
            onChange={(e) => onKnowledgeBaseChange(e.target.value)}
            placeholder="Enter the knowledge base content..."
            className="min-h-[200px]"
          />
        </div>
      </CardContent>
    </Card>
  );
};