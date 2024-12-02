import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserActivity {
  id: string;
  activity_type: string;
  page_path: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

export const useUserActivity = (userId: string) => {
  return useQuery({
    queryKey: ["user-activity", userId],
    queryFn: async () => {
      console.log("Fetching user activity for:", userId);
      const { data, error } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user activity:", error);
        throw error;
      }

      console.log("Fetched user activity:", data);
      return data as UserActivity[];
    },
  });
};