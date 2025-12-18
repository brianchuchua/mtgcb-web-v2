import { CardSettingGroup } from '@/components/cards/CardSettingsPanel';
import { PriceType } from '@/types/pricing';

/**
 * Type for the view mode
 */
export type ViewMode = 'grid' | 'table';

/**
 * Pagination properties
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  viewMode: ViewMode;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onViewModeChange: (mode: ViewMode) => void;
  isLoading: boolean;
  isInitialLoading: boolean;
  contentType: 'cards' | 'sets';
  settingGroups: CardSettingGroup[];
}

/**
 * Gallery settings
 */
export interface GallerySettings {
  cardsPerRow: number;
  cardSizeMargin: number;
  nameIsVisible: boolean;
  setIsVisible: boolean;
  priceIsVisible: boolean;
}

/**
 * Table settings
 */
export interface TableSettings {
  setIsVisible: boolean;
  collectorNumberIsVisible: boolean;
  mtgcbNumberIsVisible: boolean;
  rarityIsVisible: boolean;
  typeIsVisible: boolean;
  artistIsVisible: boolean;
  manaCostIsVisible: boolean;
  powerIsVisible: boolean;
  toughnessIsVisible: boolean;
  loyaltyIsVisible: boolean;
  priceIsVisible: boolean;
  foilPriceIsVisible: boolean;
  quantityIsVisible?: boolean;
  locationsIsVisible?: boolean;
}

/**
 * Card display settings
 */
export interface CardDisplaySettings {
  nameIsVisible: boolean;
  setIsVisible: boolean;
  priceIsVisible: boolean;
  quantityIsVisible?: boolean;
  goalProgressIsVisible?: boolean;
  locationsIsVisible?: boolean;
}

/**
 * Grid settings for sets
 */
export interface SetGridSettings {
  nameIsVisible: boolean;
  codeIsVisible: boolean;
  releaseDateIsVisible: boolean;
  typeIsVisible: boolean;
  categoryIsVisible: boolean;
  cardCountIsVisible: boolean;
  costsIsVisible: boolean;
}

/**
 * Table settings for sets
 */
export interface SetTableSettings {
  codeIsVisible: boolean;
  cardCountIsVisible: boolean;
  releaseDateIsVisible: boolean;
  typeIsVisible: boolean;
  categoryIsVisible: boolean;
  isDraftableIsVisible: boolean;
}

/**
 * Set display settings
 */
export interface SetDisplaySettings {
  grid: SetGridSettings;
  table: SetTableSettings;
}

/**
 * Sorting state
 */
export interface SortingState {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  handleSort: (columnId: string) => void;
}

/**
 * Card data from the card hook
 */
export interface CardData {
  items: any[];
  rawItems: any[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  error: any;
  apiArgs: any;
  handleCardClick: (cardId: string, cardName?: string) => void;
  refetch: () => void;
  username?: string;
  collectionSummary?: {
    totalCardsCollected?: number;
    uniquePrintingsCollected?: number;
    numberOfCardsInMagic?: number;
    percentageCollected?: number;
    totalValue?: number;
    hideCollectionValue?: boolean;
  };
  goalSummary?: any;
}

/**
 * Set data from the set hook
 */
export interface SetData {
  items: any[];
  total: number;
  isLoading: boolean;
  error: any;
  apiArgs: any;
  costToComplete: any;
  handleSetClick: (set: any) => void;
  refetch: () => void;
  username?: string;
  collectionSummary?: {
    totalCardsCollected?: number;
    uniquePrintingsCollected?: number;
    numberOfCardsInMagic?: number;
    percentageCollected?: number;
    totalValue?: number;
    hideCollectionValue?: boolean;
  };
  goalSummary?: any;
}

/**
 * Display settings from the display settings hook
 */
export interface DisplaySettings {
  settingGroups: CardSettingGroup[];
  gallerySettings: GallerySettings;
  tableSettings: TableSettings;
  cardDisplaySettings: CardDisplaySettings;
  setDisplaySettings: SetDisplaySettings;
  priceType: PriceType;
}

/**
 * Props for cards view
 */
export interface CardsProps {
  items: any[];
  loading: boolean;
  isFetching?: boolean;
  viewMode: ViewMode;
  onSort: (columnId: string) => void;
  onCardClick: (cardId: string, cardName?: string) => void;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  gallerySettings: GallerySettings;
  tableSettings: TableSettings;
  cardDisplaySettings: CardDisplaySettings;
  priceType: PriceType;
  username?: string;
  collectionSummary?: {
    totalCardsCollected?: number;
    uniquePrintingsCollected?: number;
    numberOfCardsInMagic?: number;
    percentageCollected?: number;
    totalValue?: number;
    hideCollectionValue?: boolean;
  };
  goalSummary?: {
    goalId: number;
    goalName: string;
    totalCards: number;
    collectedCards: number;
    percentageCollected: number;
    totalValue: number;
    costToComplete: number;
  };
}

/**
 * Props for sets view
 */
export interface SetsProps {
  setItems: any[];
  isLoading: boolean;
  viewMode: ViewMode;
  onSort: (columnId: string) => void;
  onSetClick: (set: any) => void;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  displaySettings: SetDisplaySettings;
  costToCompleteData: any;
  includeSubsetsInSets: boolean;
  username?: string;
  collectionSummary?: {
    totalCardsCollected?: number;
    uniquePrintingsCollected?: number;
    numberOfCardsInMagic?: number;
    percentageCollected?: number;
    totalValue?: number;
    hideCollectionValue?: boolean;
  };
  goalSummary?: {
    goalId: number;
    goalName: string;
    totalCards: number;
    collectedCards: number;
    percentageCollected: number;
    totalValue: number;
    costToComplete: number;
  };
}

/**
 * Browse controller return type
 * This defines the shape of data consumed by presentational components
 */
export interface BrowseControllerResult {
  view: 'cards' | 'sets';
  viewMode: ViewMode;
  error: any;
  paginationProps: PaginationProps;
  cardsProps: CardsProps | Record<string, never>;
  setsProps: SetsProps | Record<string, never>;
}

/**
 * Input props for Card payload builder
 */
export interface CardPayloadProps {
  currentView: 'cards' | 'sets';
  viewMode: ViewMode;
  pagination: {
    currentPage: number;
    pageSize: number;
    viewMode: ViewMode;
  };
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (size: number) => void;
  changeViewMode: (mode: ViewMode) => void;
  cardData: CardData;
  displaySettings: DisplaySettings;
  sorting: SortingState;
  initialLoadComplete: boolean;
  selectedGoalId?: number | null;
  userId?: number;
}

/**
 * Input props for Set payload builder
 */
export interface SetPayloadProps {
  currentView: 'cards' | 'sets';
  viewMode: ViewMode;
  pagination: {
    currentPage: number;
    pageSize: number;
    viewMode: ViewMode;
  };
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (size: number) => void;
  changeViewMode: (mode: ViewMode) => void;
  setData: SetData;
  displaySettings: DisplaySettings;
  sorting: SortingState;
  initialLoadComplete: boolean;
  includeSubsetsInSets: boolean;
  selectedGoalId?: number | null;
  userId?: number;
}
