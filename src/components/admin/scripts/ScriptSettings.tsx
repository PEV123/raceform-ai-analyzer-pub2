import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const ScriptSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: scripts, isLoading } = useQuery({
    queryKey: ["scriptSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("script_settings")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const updateScript = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase
        .from("script_settings")
        .upsert(values);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scriptSettings"] });
      toast({
        title: "Success",
        description: "Script settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update script settings",
        variant: "destructive",
      });
    },
  });

  const addNewScript = async () => {
    await updateScript.mutateAsync({
      name: "New Script",
      location: "head",
      content: "",
      is_enabled: true,
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Button onClick={addNewScript}>Add New Script</Button>

      {scripts?.map((script: any) => (
        <Card key={script.id}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <Input
                value={script.name}
                onChange={(e) => updateScript.mutate({
                  ...script,
                  name: e.target.value,
                })}
                className="max-w-[200px]"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm">Enabled</span>
                <Switch
                  checked={script.is_enabled}
                  onCheckedChange={(checked) => updateScript.mutate({
                    ...script,
                    is_enabled: checked,
                  })}
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Location</label>
              <Select
                value={script.location}
                onValueChange={(value) => updateScript.mutate({
                  ...script,
                  location: value,
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="head">Head</SelectItem>
                  <SelectItem value="body">Body</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Script Content</label>
              <Textarea
                value={script.content}
                onChange={(e) => updateScript.mutate({
                  ...script,
                  content: e.target.value,
                })}
                className="font-mono"
                rows={5}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};