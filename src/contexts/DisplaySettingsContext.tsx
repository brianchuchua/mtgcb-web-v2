'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { PriceType } from '@/types/pricing';

interface DisplaySettings {
  // Price settings
  priceType: PriceType;

  // View preferences
  preferredViewMode: 'grid' | 'table';
  preferredCardViewMode: 'grid' | 'table';
  preferredSetViewMode: 'grid' | 'table';

  // Page sizes
  cardsPageSize: number;
  setsPageSize: number;

  // Layout settings
  cardsPerRow: number;
  cardSizeMargin: number;
  setsPerRow: number;

  // Card display settings
  cardNameIsVisible: boolean;
  cardSetIconIsVisible: boolean;
  cardSetNameIsVisible: boolean;
  cardManaCostIsVisible: boolean;
  cardTypesIsVisible: boolean;
  cardImageIsVisible: boolean;
  cardRarityIsVisible: boolean;
  cardArtistIsVisible: boolean;
  cardPriceIsVisible: boolean;
  cardOwnedIsVisible: boolean;
  cardOwnedFoilIsVisible: boolean;
  cardGoalProgressIsVisible: boolean;
  cardLocationsIsVisible: boolean;

  // Set display settings (grid view)
  setNameIsVisible: boolean;
  setCodeIsVisible: boolean;
  setReleaseDateIsVisible: boolean;
  setTypeIsVisible: boolean;
  setCategoryIsVisible: boolean;
  setCardCountIsVisible: boolean;
  setPriceIsVisible: boolean;
  setPercentCollectedIsVisible: boolean;
  setCardsCollectedIsVisible: boolean;
  setIconIsVisible: boolean;

  // Table-specific card settings
  cardNumberIsVisible: boolean;
  convertedManaCostIsVisible: boolean;
  powerToughnessIsVisible: boolean;
  tableMtgcbNumberIsVisible: boolean;
  tableLoyaltyIsVisible: boolean;
  tableCollectorNumberIsVisible: boolean;
  tableRarityIsVisible: boolean;
  tableTypeIsVisible: boolean;
  tableArtistIsVisible: boolean;
  tableManaCostIsVisible: boolean;
  tablePowerIsVisible: boolean;
  tableToughnessIsVisible: boolean;
  tableSetIsVisible: boolean;
  tablePriceIsVisible: boolean;

  // Table-specific set settings
  tableSetCodeIsVisible: boolean;
  tableSetCardCountIsVisible: boolean;
  tableSetReleaseDateIsVisible: boolean;
  tableSetTypeIsVisible: boolean;
  tableSetCategoryIsVisible: boolean;
  tableSetIsDraftableIsVisible: boolean;

  // Collection-specific settings
  quantityIsVisible: boolean;
  lastModifiedIsVisible: boolean;
  tableQuantityIsVisible: boolean;
  tableLocationsIsVisible: boolean;

  // Collection set-specific settings
  completionIsVisible: boolean;
  costToCompleteIsVisible: boolean;
  valueIsVisible: boolean;
  tableCollectionCompletionIsVisible: boolean;
  tableCollectionCostToCompleteIsVisible: boolean;
  tableCollectionValueIsVisible: boolean;

  // Costs to Complete expansion settings
  costsToCompleteExpanded: boolean;

  // Set progress bar style
  setProgressBarStyle: 'radial' | 'linear';
}

interface DisplaySettingsContextType {
  settings: DisplaySettings;
  updateSetting: <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => void;
  updateMultipleSettings: (updates: Partial<DisplaySettings>) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS: DisplaySettings = {
  // Price settings
  priceType: PriceType.Market,

  // View preferences
  preferredViewMode: 'grid',
  preferredCardViewMode: 'grid',
  preferredSetViewMode: 'grid',

  // Page sizes
  cardsPageSize: 20,
  setsPageSize: 20,

  // Layout settings
  cardsPerRow: 0, // 0 means auto
  cardSizeMargin: 0.75,
  setsPerRow: 0, // 0 means auto

  // Card display settings
  cardNameIsVisible: true,
  cardSetIconIsVisible: true,
  cardSetNameIsVisible: true,
  cardManaCostIsVisible: true,
  cardTypesIsVisible: true,
  cardImageIsVisible: true,
  cardRarityIsVisible: true,
  cardArtistIsVisible: false,
  cardPriceIsVisible: true,
  cardOwnedIsVisible: true,
  cardOwnedFoilIsVisible: true,
  cardGoalProgressIsVisible: false,
  cardLocationsIsVisible: true,

  // Set display settings (grid view)
  setNameIsVisible: true,
  setCodeIsVisible: true,
  setReleaseDateIsVisible: true,
  setTypeIsVisible: true,
  setCategoryIsVisible: true,
  setCardCountIsVisible: true,
  setPriceIsVisible: true,
  setPercentCollectedIsVisible: true,
  setCardsCollectedIsVisible: true,
  setIconIsVisible: true,

  // Table-specific card settings
  cardNumberIsVisible: true,
  convertedManaCostIsVisible: false,
  powerToughnessIsVisible: true,
  tableMtgcbNumberIsVisible: false,
  tableLoyaltyIsVisible: false,
  tableCollectorNumberIsVisible: true,
  tableRarityIsVisible: false,
  tableTypeIsVisible: false,
  tableArtistIsVisible: false,
  tableManaCostIsVisible: false,
  tablePowerIsVisible: false,
  tableToughnessIsVisible: false,
  tableSetIsVisible: true,
  tablePriceIsVisible: true,

  // Table-specific set settings
  tableSetCodeIsVisible: false,
  tableSetCardCountIsVisible: true,
  tableSetReleaseDateIsVisible: true,
  tableSetTypeIsVisible: true,
  tableSetCategoryIsVisible: true,
  tableSetIsDraftableIsVisible: false,

  // Collection-specific settings
  quantityIsVisible: true,
  lastModifiedIsVisible: false,
  tableQuantityIsVisible: true,
  tableLocationsIsVisible: true,

  // Collection set-specific settings
  completionIsVisible: true,
  costToCompleteIsVisible: true,
  valueIsVisible: true,
  tableCollectionCompletionIsVisible: true,
  tableCollectionCostToCompleteIsVisible: true,
  tableCollectionValueIsVisible: true,

  // Costs to Complete expansion settings
  costsToCompleteExpanded: false,

  // Set progress bar style
  setProgressBarStyle: 'linear',
};

const STORAGE_KEY = 'mtgcb-display-settings';

const DisplaySettingsContext = createContext<DisplaySettingsContextType | undefined>(undefined);

export function DisplaySettingsProvider({ children }: { children: React.ReactNode }) {
  // Check if we're on the client
  const isClient = typeof window !== 'undefined';

  // Initialize settings - on server use defaults, on client read from localStorage
  const [settings, setSettings] = useState<DisplaySettings>(() => {
    if (!isClient) {
      // Server side - always use defaults
      return DEFAULT_SETTINGS;
    }

    // Client side - try to read from localStorage
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all keys exist
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Error loading display settings:', error);
    }

    return DEFAULT_SETTINGS;
  });

  // Save to localStorage whenever settings change
  const saveSettings = useCallback((newSettings: DisplaySettings) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.warn('Error saving display settings:', error);
      }
    }
  }, []);

  const updateSetting = useCallback(
    <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => {
      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value };
        saveSettings(newSettings);
        return newSettings;
      });
    },
    [saveSettings],
  );

  const updateMultipleSettings = useCallback(
    (updates: Partial<DisplaySettings>) => {
      setSettings((prev) => {
        const newSettings = { ...prev, ...updates };
        saveSettings(newSettings);
        return newSettings;
      });
    },
    [saveSettings],
  );

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  const value = useMemo(
    () => ({
      settings,
      updateSetting,
      updateMultipleSettings,
      resetToDefaults,
    }),
    [settings, updateSetting, updateMultipleSettings, resetToDefaults],
  );

  return <DisplaySettingsContext.Provider value={value}>{children}</DisplaySettingsContext.Provider>;
}

export function useDisplaySettings() {
  const context = useContext(DisplaySettingsContext);
  if (!context) {
    throw new Error('useDisplaySettings must be used within DisplaySettingsProvider');
  }
  return context;
}

// Convenience hooks for specific settings
export function usePriceType(): [PriceType, (value: PriceType) => void] {
  const { settings, updateSetting } = useDisplaySettings();
  return [settings.priceType, (value) => updateSetting('priceType', value)];
}

export function useCardDisplaySettings() {
  const { settings } = useDisplaySettings();
  return {
    nameIsVisible: settings.cardNameIsVisible,
    setIconIsVisible: settings.cardSetIconIsVisible,
    setNameIsVisible: settings.cardSetNameIsVisible,
    manaCostIsVisible: settings.cardManaCostIsVisible,
    typesIsVisible: settings.cardTypesIsVisible,
    imageIsVisible: settings.cardImageIsVisible,
    rarityIsVisible: settings.cardRarityIsVisible,
    artistIsVisible: settings.cardArtistIsVisible,
    priceIsVisible: settings.cardPriceIsVisible,
    ownedIsVisible: settings.cardOwnedIsVisible,
    ownedFoilIsVisible: settings.cardOwnedFoilIsVisible,
    goalProgressIsVisible: settings.cardGoalProgressIsVisible,
    locationsIsVisible: settings.cardLocationsIsVisible,
  };
}

export function useCostsToCompleteExpanded(): [boolean, (value: boolean) => void] {
  const { settings, updateSetting } = useDisplaySettings();
  return [settings.costsToCompleteExpanded, (value) => updateSetting('costsToCompleteExpanded', value)];
}

export function useSetDisplaySettings() {
  const { settings } = useDisplaySettings();
  return {
    nameIsVisible: settings.setNameIsVisible,
    codeIsVisible: settings.setCodeIsVisible,
    releaseDateIsVisible: settings.setReleaseDateIsVisible,
    typeIsVisible: settings.setTypeIsVisible,
    categoryIsVisible: settings.setCategoryIsVisible,
    cardCountIsVisible: settings.setCardCountIsVisible,
    priceIsVisible: settings.setPriceIsVisible,
    percentCollectedIsVisible: settings.setPercentCollectedIsVisible,
    cardsCollectedIsVisible: settings.setCardsCollectedIsVisible,
    iconIsVisible: settings.setIconIsVisible,
  };
}

export function useLayoutSettings() {
  const { settings, updateSetting } = useDisplaySettings();
  return {
    cardsPerRow: settings.cardsPerRow,
    cardSizeMargin: settings.cardSizeMargin,
    setsPerRow: settings.setsPerRow,
    setCardsPerRow: (value: number) => updateSetting('cardsPerRow', value),
    setCardSizeMargin: (value: number) => updateSetting('cardSizeMargin', value),
    setSetsPerRow: (value: number) => updateSetting('setsPerRow', value),
  };
}

export function useTableCardSettings() {
  const { settings } = useDisplaySettings();
  return {
    cardNumberIsVisible: settings.cardNumberIsVisible,
    convertedManaCostIsVisible: settings.convertedManaCostIsVisible,
    powerToughnessIsVisible: settings.powerToughnessIsVisible,
    mtgcbNumberIsVisible: settings.tableMtgcbNumberIsVisible,
    loyaltyIsVisible: settings.tableLoyaltyIsVisible,
    collectorNumberIsVisible: settings.tableCollectorNumberIsVisible,
    rarityIsVisible: settings.tableRarityIsVisible,
    typeIsVisible: settings.tableTypeIsVisible,
    artistIsVisible: settings.tableArtistIsVisible,
    manaCostIsVisible: settings.tableManaCostIsVisible,
    powerIsVisible: settings.tablePowerIsVisible,
    toughnessIsVisible: settings.tableToughnessIsVisible,
    setIsVisible: settings.tableSetIsVisible,
    priceIsVisible: settings.tablePriceIsVisible,
  };
}

export function useTableSetSettings() {
  const { settings } = useDisplaySettings();
  return {
    codeIsVisible: settings.tableSetCodeIsVisible,
    cardCountIsVisible: settings.tableSetCardCountIsVisible,
    releaseDateIsVisible: settings.tableSetReleaseDateIsVisible,
    typeIsVisible: settings.tableSetTypeIsVisible,
    categoryIsVisible: settings.tableSetCategoryIsVisible,
    isDraftableIsVisible: settings.tableSetIsDraftableIsVisible,
  };
}

export function useCollectionSettings() {
  const { settings } = useDisplaySettings();
  return {
    quantityIsVisible: settings.quantityIsVisible,
    lastModifiedIsVisible: settings.lastModifiedIsVisible,
    tableQuantityIsVisible: settings.tableQuantityIsVisible,
    tableLocationsIsVisible: settings.tableLocationsIsVisible,
  };
}

export function useCollectionSetSettings() {
  const { settings } = useDisplaySettings();
  return {
    completionIsVisible: settings.completionIsVisible,
    costToCompleteIsVisible: settings.costToCompleteIsVisible,
    valueIsVisible: settings.valueIsVisible,
    tableCompletionIsVisible: settings.tableCollectionCompletionIsVisible,
    tableCostToCompleteIsVisible: settings.tableCollectionCostToCompleteIsVisible,
    tableValueIsVisible: settings.tableCollectionValueIsVisible,
  };
}

export function usePreferredViewMode(): ['grid' | 'table', (value: 'grid' | 'table') => void] {
  const { settings, updateSetting } = useDisplaySettings();
  return [settings.preferredViewMode, (value) => updateSetting('preferredViewMode', value)];
}

export function useCardsPageSize(): [number, (value: number) => void] {
  const { settings, updateSetting } = useDisplaySettings();
  return [settings.cardsPageSize, (value) => updateSetting('cardsPageSize', value)];
}

export function useSetsPageSize(): [number, (value: number) => void] {
  const { settings, updateSetting } = useDisplaySettings();
  return [settings.setsPageSize, (value) => updateSetting('setsPageSize', value)];
}

export function usePreferredCardViewMode(): ['grid' | 'table', (value: 'grid' | 'table') => void] {
  const { settings, updateSetting } = useDisplaySettings();
  return [settings.preferredCardViewMode, (value) => updateSetting('preferredCardViewMode', value)];
}

export function usePreferredSetViewMode(): ['grid' | 'table', (value: 'grid' | 'table') => void] {
  const { settings, updateSetting } = useDisplaySettings();
  return [settings.preferredSetViewMode, (value) => updateSetting('preferredSetViewMode', value)];
}

export function useSetProgressBarStyle(): ['radial' | 'linear', (value: 'radial' | 'linear') => void] {
  const { settings, updateSetting } = useDisplaySettings();
  return [settings.setProgressBarStyle, (value) => updateSetting('setProgressBarStyle', value)];
}
