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
        return {
          ...profile,
          email: (profile as unknown as ProfileWithUser).users?.email
        } as ProfileData;
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
      return {
        ...newProfile,
        email: (newProfile as unknown as ProfileWithUser).users?.email
      } as ProfileData;
    },
  });
};