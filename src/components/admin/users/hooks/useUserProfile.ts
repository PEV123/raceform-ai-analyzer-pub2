import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProfileData } from "../profile/types";

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      console.log("Fetching user profile for:", userId);
      
      // Check if profile exists
      const { data: profiles, error: fetchError } = await supabase
        .from("profiles")
        .select()
        .eq("id", userId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching user profile:", fetchError);
        throw fetchError;
      }

      // If profile exists, return it
      if (profiles) {
        const profile = profiles;
        console.log("Found existing profile:", profile);
        
        const profileData: ProfileData = {
          id: profile.id,
          full_name: profile.full_name || null,
          email: profile.email || null,
          membership_level: profile.membership_level || 'free',
          subscription_status: profile.subscription_status || 'active',
          phone: profile.phone || null,
          company: profile.company || null,
          address: profile.address || null,
          city: profile.city || null,
          country: profile.country || null,
          postal_code: profile.postal_code || null,
          notes: profile.notes || null,
          last_login: profile.last_login || null,
          is_admin: profile.is_admin || false,
          updated_at: profile.updated_at
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
          updated_at: new Date().toISOString()
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
        full_name: newProfile.full_name || null,
        email: newProfile.email || null,
        membership_level: newProfile.membership_level || 'free',
        subscription_status: newProfile.subscription_status || 'active',
        phone: newProfile.phone || null,
        company: newProfile.company || null,
        address: newProfile.address || null,
        city: newProfile.city || null,
        country: newProfile.country || null,
        postal_code: newProfile.postal_code || null,
        notes: newProfile.notes || null,
        last_login: newProfile.last_login || null,
        is_admin: newProfile.is_admin || false,
        updated_at: newProfile.updated_at
      };
      return newProfileData;
    },
  });
};