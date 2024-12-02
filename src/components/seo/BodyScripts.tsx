import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BodyScripts = () => {
  const { data: scripts } = useQuery({
    queryKey: ["scriptSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("script_settings")
        .select("*")
        .eq("is_enabled", true)
        .eq("location", "body");
      
      if (error) throw error;
      return data;
    },
  });

  if (!scripts?.length) return null;

  return (
    <>
      {scripts.map(script => (
        <div key={script.id} dangerouslySetInnerHTML={{ __html: script.content }} />
      ))}
    </>
  );
};