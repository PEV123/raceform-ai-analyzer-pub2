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
      
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select()
        .eq("id", userId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking profile existence:", checkError);
        throw checkError;
      }

      if (!existingProfile) {
        console.log("Profile not found, creating new profile");
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({ 
            id: userId,
            ...updatedProfile,
            membership_level: updatedProfile.membership_level || "free",
            subscription_status: updatedProfile.subscription_status || "active"
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
          throw createError;
        }

        return newProfile;
      }

      console.log("Updating existing profile");
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          ...updatedProfile,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw updateError;
      }

      // Track profile update
      await trackActivity('profile_update', undefined, {
        updatedFields: Object.keys(updatedProfile)
      });

      return updated;
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