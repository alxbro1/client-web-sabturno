import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { scheduleService } from '../services/schedule.service';
import { ScheduleTemplateFromAPI } from '../types/schedule.types';

interface UseScheduleTemplateListState {
  templates: ScheduleTemplateFromAPI[];
  isLoading: boolean;
  error: string | null;
  refreshing: boolean;
}

export const useScheduleTemplateList = () => {
  const { user } = useAuth();
  const localId = user?.id;

  const [state, setState] = useState<UseScheduleTemplateListState>({
    templates: [],
    isLoading: true,
    error: null,
    refreshing: false,
  });

  const fetchTemplates = useCallback(async (isRefresh: boolean = false) => {
    if (!localId) return;

    try {
      setState(prev => ({
        ...prev,
        isLoading: !isRefresh,
        refreshing: isRefresh,
        error: null,
      }));

      const templates = await scheduleService.getTemplates(localId);

      setState(prev => ({
        ...prev,
        templates,
        isLoading: false,
        refreshing: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar los templates';
      setState(prev => ({
        ...prev,
        templates: [],
        isLoading: false,
        refreshing: false,
        error: errorMessage,
      }));
    }
  }, [localId]);

  const updateTemplateStatus = useCallback(async (templateId: string, isActive: boolean): Promise<boolean> => {
    try {
      if (isActive) {
        const updatedTemplates = state.templates.map(template => ({
          ...template,
          isActive: template.id === templateId
        }));
        setState(prev => ({
          ...prev,
          templates: updatedTemplates,
        }));
      } else {
        setState(prev => ({
          ...prev,
          templates: prev.templates.map(template =>
            template.id === templateId ? { ...template, isActive } : template
          ),
        }));
      }

      await scheduleService.updateTemplateStatus(templateId, isActive);

      return true;
    } catch (error) {
      fetchTemplates();
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el template';
      console.error(errorMessage);
      return false;
    }
  }, [state.templates, fetchTemplates]);

  const deleteTemplate = useCallback(async (template: ScheduleTemplateFromAPI): Promise<boolean> => {
    try {
      await scheduleService.deleteTemplate(template.id);

      setState(prev => ({
        ...prev,
        templates: prev.templates.filter(t => t.id !== template.id),
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el template';
      console.error(errorMessage);
      return false;
    }
  }, []);

  const refreshTemplates = useCallback(() => {
    fetchTemplates(true);
  }, [fetchTemplates]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates: state.templates,
    isLoading: state.isLoading,
    error: state.error,
    refreshing: state.refreshing,
    deleteTemplate,
    refreshTemplates,
    updateTemplateStatus,
  };
};