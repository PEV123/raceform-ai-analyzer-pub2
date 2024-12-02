import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const SeoSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPath, setNewPath] = useState("");
  
  const { data: seoSettings, isLoading } = useQuery({
    queryKey: ["seoSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_settings")
        .select("*")
        .order("page_path");
      
      if (error) throw error;
      return data;
    },
  });

  const updateSeoSetting = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase
        .from("seo_settings")
        .upsert(values);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seoSettings"] });
      toast({
        title: "Success",
        description: "SEO settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update SEO settings",
        variant: "destructive",
      });
    },
  });

  const handleAddPath = async () => {
    if (!newPath) return;
    
    await updateSeoSetting.mutateAsync({
      page_path: newPath,
      title: "",
      description: "",
      keywords: "",
    });
    
    setNewPath("");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium">Add New Page Path</label>
          <Input
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            placeholder="/example-path"
          />
        </div>
        <Button onClick={handleAddPath}>Add Path</Button>
      </div>

      {seoSettings?.map((setting: any) => (
        <Card key={setting.id}>
          <CardHeader>
            <CardTitle className="text-lg">{setting.page_path}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={setting.title || ""}
                onChange={(e) => updateSeoSetting.mutate({
                  ...setting,
                  title: e.target.value,
                })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={setting.description || ""}
                onChange={(e) => updateSeoSetting.mutate({
                  ...setting,
                  description: e.target.value,
                })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Keywords</label>
              <Input
                value={setting.keywords || ""}
                onChange={(e) => updateSeoSetting.mutate({
                  ...setting,
                  keywords: e.target.value,
                })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">OG Title</label>
              <Input
                value={setting.og_title || ""}
                onChange={(e) => updateSeoSetting.mutate({
                  ...setting,
                  og_title: e.target.value,
                })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">OG Description</label>
              <Textarea
                value={setting.og_description || ""}
                onChange={(e) => updateSeoSetting.mutate({
                  ...setting,
                  og_description: e.target.value,
                })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">OG Image URL</label>
              <Input
                value={setting.og_image || ""}
                onChange={(e) => updateSeoSetting.mutate({
                  ...setting,
                  og_image: e.target.value,
                })}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};