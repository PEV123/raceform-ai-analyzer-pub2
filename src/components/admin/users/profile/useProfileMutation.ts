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
      
      // First verify the profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select()
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching existing profile:", fetchError);
        throw fetchError;
      }

      if (!existingProfile) {
        console.error("Profile not found for user:", userId);
        throw new Error("Profile not found");
      }

      console.log("Existing profile:", existingProfile);

      // Prepare update payload - only include fields that are actually being updated
      const updatePayload: Partial<ProfileData> & { updated_at: string } = {
        updated_at: new Date().toISOString()
      };
      
      if (updatedProfile.membership_level !== undefined) {
        updatePayload.membership_level = updatedProfile.membership_level;
      }
      if (updatedProfile.full_name !== undefined) {
        updatePayload.full_name = updatedProfile.full_name;
      }
      if (updatedProfile.email !== undefined) {
        updatePayload.email = updatedProfile.email;
      }
      if (updatedProfile.phone !== undefined) {
        updatePayload.phone = updatedProfile.phone;
      }
      if (updatedProfile.company !== undefined) {
        updatePayload.company = updatedProfile.company;
      }
      if (updatedProfile.address !== undefined) {
        updatePayload.address = updatedProfile.address;
      }
      if (updatedProfile.city !== undefined) {
        updatePayload.city = updatedProfile.city;
      }
      if (updatedProfile.country !== undefined) {
        updatePayload.country = updatedProfile.country;
      }
      if (updatedProfile.postal_code !== undefined) {
        updatePayload.postal_code = updatedProfile.postal_code;
      }
      if (updatedProfile.subscription_status !== undefined) {
        updatePayload.subscription_status = updatedProfile.subscription_status;
      }
      if (updatedProfile.notes !== undefined) {
        updatePayload.notes = updatedProfile.notes;
      }

      console.log("Final update payload:", updatePayload);

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw updateError;
      }

      if (!data) {
        console.error("No data returned after update");
        throw new Error("Failed to update profile");
      }

      console.log("Profile updated successfully:", data);

      // Track profile update
      await trackActivity('profile_update', undefined, {
        updatedFields: Object.keys(updatePayload)
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