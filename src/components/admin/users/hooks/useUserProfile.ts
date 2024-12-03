import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProfileData } from "../profile/types";
import type { Tables } from "@/integrations/supabase/types";

type ProfileWithUser = Tables<'profiles'> & {
  users: {
    email: string;
  };
};

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      console.log("Fetching user profile:", userId);
      
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select(`
          *,
          users:auth.users (
            email
          )
        `)
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching user profile:", fetchError);
        throw fetchError;
      }

      if (profile) {
        console.log("Found existing profile:", profile);
        const typedProfile = profile as unknown as ProfileWithUser;
        const profileData: ProfileData = {
          id: typedProfile.id,
          full_name: typedProfile.full_name,
          email: typedProfile.users?.email,
          membership_level: typedProfile.membership_level,
          subscription_status: typedProfile.subscription_status,
          phone: typedProfile.phone,
          company: typedProfile.company,
          address: typedProfile.address,
          city: typedProfile.city,
          country: typedProfile.country,
          postal_code: typedProfile.postal_code,
          notes: typedProfile.notes,
          last_login: typedProfile.last_login,
          is_admin: typedProfile.is_admin || false
        };
        return profileData;
      }

      console.log("No profile found, creating default profile");
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          membership_level: "free",
          subscription_status: "active",
        })
        .select(`
          *,
          users:auth.users (
            email
          )
        `)
        .single();

      if (createError) {
        console.error("Error creating default profile:", createError);
        throw createError;
      }

      console.log("Created new profile:", newProfile);
      const typedNewProfile = newProfile as unknown as ProfileWithUser;
      const newProfileData: ProfileData = {
        id: typedNewProfile.id,
        full_name: typedNewProfile.full_name,
        email: typedNewProfile.users?.email,
        membership_level: typedNewProfile.membership_level,
        subscription_status: typedNewProfile.subscription_status,
        phone: typedNewProfile.phone,
        company: typedNewProfile.company,
        address: typedNewProfile.address,
        city: typedNewProfile.city,
        country: typedNewProfile.country,
        postal_code: typedNewProfile.postal_code,
        notes: typedNewProfile.notes,
        last_login: typedNewProfile.last_login,
        is_admin: typedNewProfile.is_admin || false
      };
      return newProfileData;
    },
  });
};