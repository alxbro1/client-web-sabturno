import { apiService } from "@/lib/api";
import type { UserProfileFormData, UserProfileResponse } from "@/lib/types/userProfile";

export const userProfileService = {
  async updateUserProfile(userId: string, profileData: UserProfileFormData) {
    const response = await apiService.patch<UserProfileResponse>(`/users/${userId}`, profileData);
    return response.data;
  },

  async uploadProfileImage(userId: string, imageFile: File) {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await apiService.post<{ imageProfile: string }>(
      `/users/${userId}/image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  },

  async deleteAccount(userId: string) {
    await apiService.delete(`/users/${userId}`);
  },
};