export interface ProfileData {
  id: string;
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
}