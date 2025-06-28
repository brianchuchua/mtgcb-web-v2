'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { PriceType } from '@/types/pricing';

interface DisplaySettings {
  // Price settings
  priceType: PriceType;
  
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
  
  // Set display settings
  setReleaseDateIsVisible: boolean;
  setPriceIsVisible: boolean;
  setPercentCollectedIsVisible: boolean;
  setCardsCollectedIsVisible: boolean;
  setIconIsVisible: boolean;
  
  // Table-specific settings
  cardNumberIsVisible: boolean;
  convertedManaCostIsVisible: boolean;
  powerToughnessIsVisible: boolean;
  
  // Collection-specific settings
  quantityIsVisible: boolean;
  lastModifiedIsVisible: boolean;
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
  
  // Set display settings
  setReleaseDateIsVisible: true,
  setPriceIsVisible: true,
  setPercentCollectedIsVisible: true,
  setCardsCollectedIsVisible: true,
  setIconIsVisible: true,
  
  // Table-specific settings
  cardNumberIsVisible: true,
  convertedManaCostIsVisible: false,
  powerToughnessIsVisible: true,
  
  // Collection-specific settings
  quantityIsVisible: true,
  lastModifiedIsVisible: false,
};

const STORAGE_KEY = 'mtgcb-display-settings';

const DisplaySettingsContext = createContext<DisplaySettingsContextType | undefined>(undefined);

export function DisplaySettingsProvider({ children }: { children: React.ReactNode }) {
  // Initialize all settings at once from localStorage
  const [settings, setSettings] = useState<DisplaySettings>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_SETTINGS;
    }

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
        // Dispatch event for other components/tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: JSON.stringify(newSettings),
          storageArea: window.localStorage
        }));
      } catch (error) {
        console.warn('Error saving display settings:', error);
      }
    }
  }, []);

  const updateSetting = useCallback(<K extends keyof DisplaySettings>(
    key: K,
    value: DisplaySettings[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  const updateMultipleSettings = useCallback((updates: Partial<DisplaySettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  const value = useMemo(() => ({
    settings,
    updateSetting,
    updateMultipleSettings,
    resetToDefaults
  }), [settings, updateSetting, updateMultipleSettings, resetToDefaults]);

  return (
    <DisplaySettingsContext.Provider value={value}>
      {children}
    </DisplaySettingsContext.Provider>
  );
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
  };
}

export function useSetDisplaySettings() {
  const { settings } = useDisplaySettings();
  return {
    releaseDateIsVisible: settings.setReleaseDateIsVisible,
    priceIsVisible: settings.setPriceIsVisible,
    percentCollectedIsVisible: settings.setPercentCollectedIsVisible,
    cardsCollectedIsVisible: settings.setCardsCollectedIsVisible,
    iconIsVisible: settings.setIconIsVisible,
  };
}