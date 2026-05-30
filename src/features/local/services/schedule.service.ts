import { apiService } from '@/lib/api';
import type { ScheduleTemplate, ScheduleTemplateFromAPI, CreateScheduleTemplateRequest } from '../types/schedule.types';

export const scheduleService = {
  getTemplates: async (localId: string): Promise<ScheduleTemplateFromAPI[]> => {
    try {
      const response = await apiService.get<{ items?: ScheduleTemplateFromAPI[] } | ScheduleTemplateFromAPI[]>(`/local/${localId}/schedule-templates`);
      const data = response.data;
      if (Array.isArray(data)) return data;
      return data?.items || [];
    } catch (error) {
      console.error('Error fetching schedule templates:', error);
      return [];
    }
  },

  getTemplate: async (templateId: string): Promise<ScheduleTemplate | null> => {
    try {
      const response = await apiService.get<ScheduleTemplate>(`/local/schedule-templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule template:', error);
      return null;
    }
  },

  createTemplate: async (data: CreateScheduleTemplateRequest): Promise<ScheduleTemplate> => {
    const response = await apiService.post<ScheduleTemplate>('/local/schedule-templates', data);
    return response.data;
  },

  updateTemplate: async (templateId: string, data: ScheduleTemplate): Promise<ScheduleTemplate> => {
    const response = await apiService.put<ScheduleTemplate>(`/local/schedule-templates/${templateId}`, data);
    return response.data;
  },

  updateTemplateStatus: async (templateId: string, isActive: boolean): Promise<void> => {
    await apiService.patch(`/local/schedule-templates/${templateId}`, { isActive });
  },

  deleteTemplate: async (templateId: string): Promise<void> => {
    await apiService.delete(`/local/schedule-templates/${templateId}`);
  },
};