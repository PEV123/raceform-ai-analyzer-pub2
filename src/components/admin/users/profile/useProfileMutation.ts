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
        // First check if the profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (checkError) {
          console.error("Error checking profile:", checkError);
          throw new Error("Failed to check if profile exists");
        }

        if (!existingProfile) {
          console.log("Profile not found, creating new profile");
          // If profile doesn't exist, create it
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({ id: userId, ...updatedProfile })
            .select()
            .single();

          if (createError) {
            console.error("Error creating profile:", createError);
            throw createError;
          }

          return newProfile;
        }

        // If profile exists, update it
        const { data: updatedData, error: updateError } = await supabase
          .from("profiles")
          .update(updatedProfile)
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

        return updatedData;
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