import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export const PageSeo = () => {
  const location = useLocation();
  
  const { data: seoSettings } = useQuery({
    queryKey: ["seoSettings", location.pathname],
    queryFn: async () => {
      console.log("Fetching SEO settings for path:", location.pathname);
      
      const { data, error } = await supabase
        .from("seo_settings")
        .select("*")
        .eq("page_path", location.pathname)
        .maybeSingle();
      
      if (error) {
        if (error.code === "PGRST116") {
          console.log("No SEO settings found for path:", location.pathname);
          return null;
        }
        console.error("Error fetching SEO settings:", error);
        throw error;
      }

      console.log("Found SEO settings:", data);
      return data;
    },
  });

  const { data: scripts } = useQuery({
    queryKey: ["scriptSettings"],
    queryFn: async () => {
      console.log("Fetching script settings");
      
      const { data, error } = await supabase
        .from("script_settings")
        .select("*")
        .eq("is_enabled", true);
      
      if (error) {
        console.error("Error fetching script settings:", error);
        throw error;
      }

      console.log("Found script settings:", data);
      return data;
    },
  });

  if (!seoSettings && !scripts?.length) {
    console.log("No SEO or script settings to apply");
    return null;
  }

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