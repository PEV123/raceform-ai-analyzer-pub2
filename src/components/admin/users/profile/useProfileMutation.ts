import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ProfileData } from "./types";
import { trackActivity } from "@/utils/activity";
import type { Tables } from "@/integrations/supabase/types";

type ProfileInsert = Tables<"profiles">;

export const useProfileMutation = (userId: string, onSuccess?: () => void) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedProfile: Partial<ProfileData>) => {
      console.log("Starting profile update for user:", userId);
      console.log("Update payload:", updatedProfile);
      
      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking profile existence:", checkError);
        throw checkError;
      }

      // Clean up the update payload to only include non-null values
      const cleanedProfile = Object.fromEntries(
        Object.entries(updatedProfile).filter(([_, value]) => value !== null)
      ) as Partial<ProfileInsert>;

      if (!existingProfile) {
        console.log("Profile not found, creating new profile");
        const insertData: ProfileInsert = {
          id: userId,
          ...cleanedProfile,
          membership_level: cleanedProfile.membership_level || "free",
          subscription_status: cleanedProfile.subscription_status || "active",
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };

        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert(insertData)
          .select()
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
          throw createError;
        }

        return newProfile;
      }

      console.log("Updating existing profile");
      const updateData: Partial<ProfileInsert> = {
        ...cleanedProfile,
        updated_at: new Date().toISOString()
      };

      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw updateError;
      }

      // Track profile update
      await trackActivity('profile_update', undefined, {
        updatedFields: Object.keys(cleanedProfile)
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