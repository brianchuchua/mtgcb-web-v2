'use client';

import { useCardSettingGroups } from './useCardSettingGroups';
import { useSetSettingGroups } from './useSetSettingGroups';
import { CardSettingGroup } from '@/components/cards/CardSettingsPanel';

/**
 * A hook that returns the appropriate setting groups based on the content type and view mode
 * Always calls both hooks to maintain hook ordering, but only returns the relevant settings
 */
export const useCardSetSettingGroups = (
  contentType: 'cards' | 'sets',
  viewMode: 'grid' | 'table',
): CardSettingGroup[] => {
  // Always call both hooks to maintain hook order consistency
  const cardSettings = useCardSettingGroups(viewMode);
  const setSettings = useSetSettingGroups(viewMode);

  // Return the appropriate settings based on content type
  return contentType === 'cards' ? cardSettings : setSettings;
};
