import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProfileData } from "../profile/types";

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      console.log("Fetching user profile for:", userId);
      
      // Check if profile exists
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select()
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching user profile:", fetchError);
        throw fetchError;
      }

      // If profile exists, return it
      if (profile) {
        console.log("Found existing profile:", profile);
        
        const profileData: ProfileData = {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          membership_level: profile.membership_level || 'free',
          subscription_status: profile.subscription_status || 'active',
          phone: profile.phone,
          company: profile.company,
          address: profile.address,
          city: profile.city,
          country: profile.country,
          postal_code: profile.postal_code,
          notes: profile.notes,
          last_login: profile.last_login,
          is_admin: profile.is_admin || false
        };
        return profileData;
      }

      // If no profile exists, create a new one
      console.log("No profile found, creating default profile");
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          membership_level: "free",
          subscription_status: "active",
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating default profile:", createError);
        throw createError;
      }

      console.log("Created new profile:", newProfile);
      const newProfileData: ProfileData = {
        id: newProfile.id,
        full_name: newProfile.full_name,
        email: newProfile.email,
        membership_level: newProfile.membership_level || 'free',
        subscription_status: newProfile.subscription_status || 'active',
        phone: newProfile.phone,
        company: newProfile.company,
        address: newProfile.address,
        city: newProfile.city,
        country: newProfile.country,
        postal_code: newProfile.postal_code,
        notes: newProfile.notes,
        last_login: newProfile.last_login,
        is_admin: newProfile.is_admin || false
      };
      return newProfileData;
    },
  });
};