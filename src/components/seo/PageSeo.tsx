import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export const PageSeo = () => {
  const location = useLocation();
  
  const { data: seoSettings } = useQuery({
    queryKey: ["seoSettings", location.pathname],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_settings")
        .select("*")
        .eq("page_path", location.pathname)
        .maybeSingle();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { data: scripts } = useQuery({
    queryKey: ["scriptSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("script_settings")
        .select("*")
        .eq("is_enabled", true);
      
      if (error) throw error;
      return data;
    },
  });

  if (!seoSettings && !scripts?.length) return null;

  return (
    <Helmet>
      {seoSettings?.title && <title>{seoSettings.title}</title>}
      {seoSettings?.description && <meta name="description" content={seoSettings.description} />}
      {seoSettings?.keywords && <meta name="keywords" content={seoSettings.keywords} />}
      
      {seoSettings?.og_title && <meta property="og:title" content={seoSettings.og_title} />}
      {seoSettings?.og_description && <meta property="og:description" content={seoSettings.og_description} />}
      {seoSettings?.og_image && <meta property="og:image" content={seoSettings.og_image} />}
      
      {scripts?.filter(s => s.location === "head").map(script => (
        <script key={script.id} dangerouslySetInnerHTML={{ __html: script.content }} />
      ))}
    </Helmet>
  );
};