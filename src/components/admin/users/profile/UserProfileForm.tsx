import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileData } from "./types";

interface UserProfileFormProps {
  profile: ProfileData;
  isEditing: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const UserProfileForm = ({
  profile,
  isEditing,
  onSubmit,
}: UserProfileFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          name="full_name"
          render={() => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  name="full_name"
                  defaultValue={profile.full_name || ""}
                  disabled={!isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="membership_level"
          render={() => (
            <FormItem>
              <FormLabel>Membership Level</FormLabel>
              <Select
                name="membership_level"
                defaultValue={profile.membership_level || "free"}
                disabled={!isEditing}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select membership level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="subscription_status"
          render={() => (
            <FormItem>
              <FormLabel>Subscription Status</FormLabel>
              <Select
                name="subscription_status"
                defaultValue={profile.subscription_status || "active"}
                disabled={!isEditing}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="phone"
          render={() => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input
                  name="phone"
                  defaultValue={profile.phone || ""}
                  disabled={!isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="company"
          render={() => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input
                  name="company"
                  defaultValue={profile.company || ""}
                  disabled={!isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="address"
          render={() => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  name="address"
                  defaultValue={profile.address || ""}
                  disabled={!isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="city"
          render={() => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input
                  name="city"
                  defaultValue={profile.city || ""}
                  disabled={!isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="country"
          render={() => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input
                  name="country"
                  defaultValue={profile.country || ""}
                  disabled={!isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="postal_code"
          render={() => (
            <FormItem>
              <FormLabel>Postal Code</FormLabel>
              <FormControl>
                <Input
                  name="postal_code"
                  defaultValue={profile.postal_code || ""}
                  disabled={!isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        name="notes"
        render={() => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                name="notes"
                defaultValue={profile.notes || ""}
                disabled={!isEditing}
                className="min-h-[100px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {isEditing && (
        <div className="flex justify-end">
          <Button type="submit">Save Changes</Button>
        </div>
      )}
    </form>
  );
};