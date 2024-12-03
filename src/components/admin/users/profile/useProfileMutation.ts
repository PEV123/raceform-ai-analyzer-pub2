import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ProfileData } from "./types";
import { trackActivity } from "@/utils/activity";

export const useProfileMutation = (userId: string, onSuccess?: () => void) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedProfile: Partial<ProfileData>) => {
      console.log("Updating profile:", updatedProfile);
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .update(updatedProfile)
          .eq("id", userId)
          .select()
          .single();

        if (error) {
          console.error("Error updating profile:", error);
          throw error;
        }

        // Track profile update
        await trackActivity('profile_update', undefined, {
          updatedFields: Object.keys(updatedProfile)
        });

        return data;
      } catch (error) {
        console.error("Error in profile mutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });
};