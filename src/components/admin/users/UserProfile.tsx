import { useState } from "react";
import { UserProfileHeader } from "./profile/UserProfileHeader";
import { UserProfileForm } from "./profile/UserProfileForm";
import { useProfileMutation } from "./profile/useProfileMutation";
import { useUserActivity } from "./hooks/useUserActivity";
import { UserActivityList } from "./profile/UserActivityList";
import { UserProfileSkeleton } from "./profile/UserProfileSkeleton";
import { useUserProfile } from "./hooks/useUserProfile";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProfileData } from "./profile/types";

interface UserProfileProps {
  userId: string;
}

export const UserProfile = ({ userId }: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
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
    return <UserProfileSkeleton />;
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