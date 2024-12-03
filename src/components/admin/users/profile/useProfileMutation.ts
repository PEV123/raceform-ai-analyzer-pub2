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
      console.log("Starting profile update for user:", userId);
      console.log("Update payload:", updatedProfile);

      const { data, error } = await supabase.functions.invoke('update-profile', {
        body: {
          id: userId,
          ...updatedProfile
        }
      });

      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }

      if (!data) {
        console.error("No data returned after update");
        throw new Error("Failed to update profile");
      }

      console.log("Profile updated successfully:", data);

      // Track profile update
      await trackActivity('profile_update', undefined, {
        updatedFields: Object.keys(updatedProfile)
      });

      return data;
    },
    onSuccess: (data) => {
      console.log("Profile update successful:", data);
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Profile update failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });
};