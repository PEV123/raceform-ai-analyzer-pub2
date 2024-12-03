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
      
      try {
        // Update the profile
        const { data, error } = await supabase
          .from("profiles")
          .update({
            membership_level: updatedProfile.membership_level,
            full_name: updatedProfile.full_name,
            email: updatedProfile.email,
            phone: updatedProfile.phone,
            company: updatedProfile.company,
            address: updatedProfile.address,
            city: updatedProfile.city,
            country: updatedProfile.country,
            postal_code: updatedProfile.postal_code,
            subscription_status: updatedProfile.subscription_status,
            notes: updatedProfile.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .maybeSingle();

        if (error) {
          console.error("Error updating profile:", error);
          throw error;
        }

        if (!data) {
          throw new Error("Profile not found");
        }

        // Track profile update
        await trackActivity('profile_update', undefined, {
          updatedFields: Object.keys(updatedProfile)
        });

        return data;
      } catch (error) {
        console.error("Profile update failed:", error);
        throw error;
      }
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