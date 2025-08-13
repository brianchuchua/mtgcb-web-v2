import React, { useRef, useEffect } from 'react';
import SearchField from './SearchField';
import OracleTextField from './OracleTextField';
import ToggleSwitch from './ToggleSwitch';
import ColorSelector from '@/features/browse/ColorSelector';
import QuantitySelector from '@/features/browse/QuantitySelector';
import RaritySelector from '@/features/browse/RaritySelector';
import SetSelector from '@/features/browse/SetSelector';
import StatSearch from '@/features/browse/StatSearch';
import TypeSelector from '@/features/browse/TypeSelector';

interface CardSearchFieldsProps {
  localCardName: string;
  localOracleText: string;
  localArtist: string;
  handleCardNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleOracleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleArtistChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reduxOneResultPerCardName: boolean;
  handleOneResultPerCardNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reduxIncludeSubsetsInSet: boolean;
  handleIncludeSubsetsInSetChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSetPage: boolean;
  isCollectionPage: boolean;
  isCollectionSetPage: boolean;
  statResetTrigger?: number;
}

const CardSearchFields: React.FC<CardSearchFieldsProps> = ({
  localCardName,
  localOracleText,
  localArtist,
  handleCardNameChange,
  handleOracleChange,
  handleArtistChange,
  reduxOneResultPerCardName,
  handleOneResultPerCardNameChange,
  reduxIncludeSubsetsInSet,
  handleIncludeSubsetsInSetChange,
  isSetPage,
  isCollectionPage,
  isCollectionSetPage,
  statResetTrigger,
}) => {
  const cardNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the card name field when the component mounts or updates
    cardNameRef.current?.focus();
  }, []);

  return (
    <>
      <SearchField
        ref={cardNameRef}
        label="Card Name"
        value={localCardName}
        onChange={handleCardNameChange}
        placeholder="Search by card name"
        inputTestId="card-name-field"
        iconTestId="card-name-search-icon"
        autoFocus
      />
      <OracleTextField value={localOracleText} onChange={handleOracleChange} />
      <SearchField label="Artist" value={localArtist} onChange={handleArtistChange} placeholder="Search by artist name" />
      <TypeSelector />
      <ColorSelector />
      <RaritySelector />
      {!isSetPage && <SetSelector />}
      <ToggleSwitch
        checked={reduxOneResultPerCardName}
        onChange={handleOneResultPerCardNameChange}
        name="oneResultPerCardName"
        label="Hide duplicate printings"
      />
      {isCollectionSetPage && (
        <ToggleSwitch
          checked={reduxIncludeSubsetsInSet}
          onChange={handleIncludeSubsetsInSetChange}
          name="includeSubsetsInSets"
          label="Track subsets with main set"
          tooltip={
            <div
              dangerouslySetInnerHTML={{
                __html:
                  'When enabled, the cost to complete will include subset cards in the calculation. <br /><br />Example: The cost to complete Tempest will include cards from Tempest Prerelease Promos and The List: Tempest.',
              }}
            />
          }
        />
      )}
      <QuantitySelector isCollectionPage={isCollectionPage} />
      <StatSearch resetTrigger={statResetTrigger} />
    </>
  );
};

export default CardSearchFields;