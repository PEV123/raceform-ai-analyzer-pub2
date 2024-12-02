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

export const UserProfile = ({ userId }: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      console.log("Fetching user profile:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        throw error;
      }

      console.log("Fetched user profile:", data);
      return data as ProfileData;
    },
  });

  const { data: activities, isLoading: activitiesLoading } = useUserActivity(userId);

  const updateProfile = useProfileMutation(userId, () => setIsEditing(false));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedProfile = {
      full_name: formData.get("full_name"),
      membership_level: formData.get("membership_level"),
      subscription_status: formData.get("subscription_status"),
      phone: formData.get("phone"),
      company: formData.get("company"),
      address: formData.get("address"),
      city: formData.get("city"),
      country: formData.get("country"),
      postal_code: formData.get("postal_code"),
      notes: formData.get("notes"),
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