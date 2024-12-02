import { Button } from "@/components/ui/button";

interface UserProfileHeaderProps {
  isEditing: boolean;
  onEditToggle: () => void;
}

export const UserProfileHeader = ({ isEditing, onEditToggle }: UserProfileHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">User Profile</h2>
      <Button
        variant={isEditing ? "outline" : "default"}
        onClick={onEditToggle}
      >
        {isEditing ? "Cancel Editing" : "Edit Profile"}
      </Button>
    </div>
  );
};