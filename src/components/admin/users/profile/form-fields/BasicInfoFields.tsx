import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import type { ProfileData } from "../types";

interface BasicInfoFieldsProps {
  control: Control<ProfileData>;
  isEditing: boolean;
}

export const BasicInfoFields = ({ control, isEditing }: BasicInfoFieldsProps) => {
  return (
    <>
      <FormField
        control={control}
        name="full_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormControl>
              <Input {...field} disabled={!isEditing} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="membership_level"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Membership Level</FormLabel>
            <Select
              disabled={!isEditing}
              onValueChange={field.onChange}
              defaultValue={field.value}
              value={field.value}
              name="membership_level"
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select membership level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
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
        control={control}
        name="subscription_status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subscription Status</FormLabel>
            <Select
              disabled={!isEditing}
              onValueChange={field.onChange}
              defaultValue={field.value}
              value={field.value}
              name="subscription_status"
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
    </>
  );
};