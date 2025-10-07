export interface PatreonTier {
  slug: 'common' | 'uncommon' | 'rare' | 'mythic';
  name: string;
  badge: 'C' | 'U' | 'R' | 'M';
  rank: number;
  isActive?: boolean;
  isOverride?: boolean;
}

export interface PatreonStatusData {
  linked: boolean;
  currentTier?: PatreonTier | null;
  highestTier?: PatreonTier | null;
}

export interface PatreonDisconnectData {
  message: string;
}

export interface PatreonBadgeData {
  patreonBadge: string | null; // 'C' | 'U' | 'R' | 'M' | '⭐' | null
  patreonRank: number; // 0-4
}

export interface PatreonSupporter {
  username: string;
  currentTier: PatreonTier | null;
  highestTier: PatreonTier;
  // Custom card for mythic supporters
  customCard?: {
    cardId: string;
    color: 'white' | 'blue' | 'black' | 'red' | 'green' | 'gold' | 'colorless';
  } | null;
}

export type CardColor = 'white' | 'blue' | 'black' | 'red' | 'green' | 'gold' | 'colorless';
