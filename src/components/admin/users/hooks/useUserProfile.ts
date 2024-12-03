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
        .select("*, users:auth.users!inner(email)")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching user profile:", fetchError);
        throw fetchError;
      }

      if (profile) {
        console.log("Found existing profile:", profile);
        const typedProfile = profile as ProfileWithUser;
        return {
          ...typedProfile,
          email: typedProfile.users?.email
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
      const typedNewProfile = newProfile as ProfileWithUser;
      return {
        ...typedNewProfile,
        email: typedNewProfile.users?.email
      } as ProfileData;
    },
  });
};