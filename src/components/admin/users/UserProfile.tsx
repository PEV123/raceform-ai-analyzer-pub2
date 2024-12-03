import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { UserProfileHeader } from "./profile/UserProfileHeader";
import { UserProfileForm } from "./profile/UserProfileForm";
import { useProfileMutation } from "./profile/useProfileMutation";
import { useUserActivity } from "./hooks/useUserActivity";
import { UserActivityList } from "./profile/UserActivityList";
import type { ProfileData } from "./profile/types";

interface UserProfileProps {
  userId: string;
}

interface ProfileResponse {
  id: string;
  email: string | null;
  full_name: string | null;
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
  } | null;
}

export const UserProfile = ({ userId }: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      console.log("Fetching user profile:", userId);
      
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*, auth.users!inner(email)")
        .eq("id", userId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching user profile:", fetchError);
        throw fetchError;
      }

      if (existingProfile) {
        console.log("Found existing profile:", existingProfile);
        const typedProfile = existingProfile as ProfileResponse;
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
        .select("*, auth.users!inner(email)")
        .single();

      if (createError) {
        console.error("Error creating default profile:", createError);
        throw createError;
      }

      console.log("Created new profile:", newProfile);
      const typedNewProfile = newProfile as ProfileResponse;
      return {
        ...typedNewProfile,
        email: typedNewProfile.users?.email
      } as ProfileData;
    },
  });

  const { data: activities, isLoading: activitiesLoading } = useUserActivity(userId);

  const updateProfile = useProfileMutation(userId, () => setIsEditing(false));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedProfile = {
      full_name: formData.get("full_name") as string,
      membership_level: formData.get("membership_level") as string,
      subscription_status: formData.get("subscription_status") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      country: formData.get("country") as string,
      postal_code: formData.get("postal_code") as string,
      notes: formData.get("notes") as string,
      email: formData.get("email") as string,
    };
    updateProfile.mutate(updatedProfile as ProfileData);
  };

  if (profileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <UserProfileHeader 
        isEditing={isEditing} 
        onEditToggle={() => setIsEditing(!isEditing)} 
      />
      {profile && (
        <UserProfileForm
          profile={profile}
          isEditing={isEditing}
          onSubmit={handleSubmit}
        />
      )}
      {activitiesLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : (
        activities && <UserActivityList activities={activities} />
      )}
    </div>
  );
};