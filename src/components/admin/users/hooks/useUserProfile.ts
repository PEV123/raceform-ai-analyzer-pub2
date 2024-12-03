import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProfileData } from "../profile/types";
import type { Tables } from "@/integrations/supabase/types";

type ProfileWithUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  membership_level: string;
  subscription_status: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  notes: string | null;
  last_login: string | null;
  is_admin: boolean;
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
        .select("*, users:auth.users!inner(email)")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching user profile:", fetchError);
        throw fetchError;
      }

      if (profile) {
        console.log("Found existing profile:", profile);
        const profileData: ProfileData = {
          id: profile.id,
          full_name: profile.full_name,
          email: (profile as unknown as ProfileWithUser).users?.email,
          membership_level: profile.membership_level,
          subscription_status: profile.subscription_status,
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

      console.log("No profile found, creating default profile");
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          membership_level: "free",
          subscription_status: "active",
        })
        .select("*, users:auth.users!inner(email)")
        .single();

      if (createError) {
        console.error("Error creating default profile:", createError);
        throw createError;
      }

      console.log("Created new profile:", newProfile);
      const newProfileData: ProfileData = {
        id: newProfile.id,
        full_name: newProfile.full_name,
        email: (newProfile as unknown as ProfileWithUser).users?.email,
        membership_level: newProfile.membership_level,
        subscription_status: newProfile.subscription_status,
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