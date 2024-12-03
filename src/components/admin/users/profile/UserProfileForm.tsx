import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import type { ProfileData } from "./types";
import { BasicInfoFields } from "./form-fields/BasicInfoFields";
import { ContactFields } from "./form-fields/ContactFields";
import { AddressFields } from "./form-fields/AddressFields";
import { NotesField } from "./form-fields/NotesField";

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
  const form = useForm<ProfileData>({
    defaultValues: {
      id: profile.id,
      full_name: profile.full_name || "",
      email: profile.email || "",
      membership_level: profile.membership_level || "free",
      subscription_status: profile.subscription_status || "active",
      phone: profile.phone || "",
      company: profile.company || "",
      address: profile.address || "",
      city: profile.city || "",
      country: profile.country || "",
      postal_code: profile.postal_code || "",
      notes: profile.notes || "",
      last_login: profile.last_login || null,
      is_admin: profile.is_admin || false,
      updated_at: profile.updated_at,
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(e.currentTarget);
    
    // Ensure membership_level is included in the form data
    const membershipLevel = formData.get('membership_level');
    if (!membershipLevel) {
      formData.set('membership_level', profile.membership_level || 'free');
    }
    
    // Ensure subscription_status is included
    const subscriptionStatus = formData.get('subscription_status');
    if (!subscriptionStatus) {
      formData.set('subscription_status', profile.subscription_status || 'active');
    }
    
    console.log("Form data before submit:", Object.fromEntries(formData.entries()));
    onSubmit(e);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <BasicInfoFields control={form.control} isEditing={isEditing} />
          <ContactFields control={form.control} isEditing={isEditing} />
          <AddressFields control={form.control} isEditing={isEditing} />
        </div>

        <NotesField control={form.control} isEditing={isEditing} />

        {isEditing && (
          <div className="flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
        )}
      </form>
    </Form>
  );
};