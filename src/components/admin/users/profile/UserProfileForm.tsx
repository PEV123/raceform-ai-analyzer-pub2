import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ProfileData } from "./types";

interface UserProfileFormProps {
  profile: ProfileData;
  isEditing: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const UserProfileForm = ({ profile, isEditing, onSubmit }: UserProfileFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
  );
};