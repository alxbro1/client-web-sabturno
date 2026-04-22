import type { User } from "@/lib/types/auth";

export interface UserProfileFormData {
  name: string;
  email: string;
  phone: string;
}

export interface UserProfileResponse extends User {
  profileImage?: string;
}