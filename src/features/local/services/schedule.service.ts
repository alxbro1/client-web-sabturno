import { apiService } from '@/lib/api';
import type { ScheduleTemplate, ScheduleTemplateFromAPI, CreateScheduleTemplateRequest } from '../types/schedule.types';

export const scheduleService = {
  getTemplates: async (localId: string): Promise<ScheduleTemplateFromAPI[]> => {
    try {
      const response = await apiService.get<{ items?: ScheduleTemplateFromAPI[] } | ScheduleTemplateFromAPI[]>(`/time-stock-template/${localId}`);
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
      const response = await apiService.get<ScheduleTemplate>(`/time-stock-template/template/${templateId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule template:', error);
      return null;
    }
  },

  createTemplate: async (data: CreateScheduleTemplateRequest): Promise<ScheduleTemplate> => {
    const response = await apiService.post<ScheduleTemplate>('/time-stock-template', data);
    return response.data;
  },

  updateTemplate: async (templateId: string, data: ScheduleTemplate): Promise<ScheduleTemplate> => {
    const response = await apiService.put<ScheduleTemplate>(`/time-stock-template/${templateId}`, data);
    return response.data;
  },

  updateTemplateStatus: async (templateId: string, isActive: boolean): Promise<void> => {
    await apiService.patch(`/time-stock-template/${templateId}/status`, { isActive });
  },

  deleteTemplate: async (templateId: string): Promise<void> => {
    await apiService.delete(`/time-stock-template/${templateId}`);
  },
};