import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface UserProfileProps {
  userId: string;
}

export const UserProfile = ({ userId }: UserProfileProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
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
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updatedProfile: any) => {
      console.log("Updating profile:", updatedProfile);
      const { data, error } = await supabase
        .from("profiles")
        .update(updatedProfile)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

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
    updateProfile.mutate(updatedProfile);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Profile</h2>
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Cancel Editing" : "Edit Profile"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={profile?.full_name || ""}
              readOnly={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="membership_level">Membership Level</Label>
            {isEditing ? (
              <Select
                name="membership_level"
                defaultValue={profile?.membership_level}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={profile?.membership_level}
                readOnly
                className="capitalize"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscription_status">Subscription Status</Label>
            {isEditing ? (
              <Select
                name="subscription_status"
                defaultValue={profile?.subscription_status}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={profile?.subscription_status}
                readOnly
                className="capitalize"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={profile?.phone || ""}
              readOnly={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              name="company"
              defaultValue={profile?.company || ""}
              readOnly={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={profile?.address || ""}
              readOnly={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              defaultValue={profile?.city || ""}
              readOnly={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              name="country"
              defaultValue={profile?.country || ""}
              readOnly={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              name="postal_code"
              defaultValue={profile?.postal_code || ""}
              readOnly={!isEditing}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Admin Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={profile?.notes || ""}
            readOnly={!isEditing}
            className="min-h-[100px]"
          />
        </div>

        {isEditing && (
          <Button type="submit" className="w-full">
            Save Changes
          </Button>
        )}
      </form>
    </div>
  );
};