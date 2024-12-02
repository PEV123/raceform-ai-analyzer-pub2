import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const PROVIDERS = ["anthropic", "openai"];
const ANTHROPIC_MODELS = [
  "claude-3-sonnet-20240229",
  "claude-3-5-sonnet-20241022",
  "claude-3-haiku-20240307",
];
const OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini"];

interface AISettingsProps {
  selectedProvider: string;
  anthropicModel: string;
  openaiModel: string;
  onProviderChange: (value: string) => void;
  onAnthropicModelChange: (value: string) => void;
  onOpenAIModelChange: (value: string) => void;
}

export const AISettings = ({
  selectedProvider,
  anthropicModel,
  openaiModel,
  onProviderChange,
  onAnthropicModelChange,
  onOpenAIModelChange,
}: AISettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>AI Provider</Label>
          <Select value={selectedProvider} onValueChange={onProviderChange}>
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
            <Label>Anthropic Model</Label>
            <Select value={anthropicModel} onValueChange={onAnthropicModelChange}>
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
            <Label>OpenAI Model</Label>
            <Select value={openaiModel} onValueChange={onOpenAIModelChange}>
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
      </CardContent>
    </Card>
  );
};