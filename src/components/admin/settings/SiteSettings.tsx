import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface SiteSettingsProps {
  siteName: string;
  raceTitleTemplate: string;
  onSiteNameChange: (value: string) => void;
  onRaceTitleTemplateChange: (value: string) => void;
}

export const SiteSettings = ({
  siteName,
  raceTitleTemplate,
  onSiteNameChange,
  onRaceTitleTemplateChange,
}: SiteSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Site Name</Label>
          <Input
            value={siteName}
            onChange={(e) => onSiteNameChange(e.target.value)}
            placeholder="Enter site name..."
          />
        </div>
        <div className="space-y-2">
          <Label>Race Title Template</Label>
          <Input
            value={raceTitleTemplate}
            onChange={(e) => onRaceTitleTemplateChange(e.target.value)}
            placeholder="[date] [venue] [time] [racename] | [sitename]"
          />
          <p className="text-sm text-muted-foreground">
            Available placeholders: [date], [venue], [time], [racename], [sitename]
          </p>
        </div>
      </CardContent>
    </Card>
  );
};