import React, { useRef, useEffect } from 'react';
import SearchField from './SearchField';
import ToggleSwitch from './ToggleSwitch';
import CompletionStatusSelector from '@/features/browse/CompletionStatusSelector';
import SetCategorySelector from '@/features/browse/SetCategorySelector';
import SetTypeSelector from '@/features/browse/SetTypeSelector';

interface SetSearchFieldsProps {
  localSetName: string;
  localSetCode: string;
  handleSetNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSetCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reduxShowSubsets: boolean;
  handleShowSubsetsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reduxIncludeSubsetsInSet: boolean;
  handleIncludeSubsetsInSetChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isCollectionPage: boolean;
}

const SetSearchFields: React.FC<SetSearchFieldsProps> = ({
  localSetName,
  localSetCode,
  handleSetNameChange,
  handleSetCodeChange,
  reduxShowSubsets,
  handleShowSubsetsChange,
  reduxIncludeSubsetsInSet,
  handleIncludeSubsetsInSetChange,
  isCollectionPage,
}) => {
  const setNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the set name field when the component mounts or updates
    setNameRef.current?.focus();
  }, []);

  return (
    <>
      <SearchField
        ref={setNameRef}
        label="Set Name"
        value={localSetName}
        onChange={handleSetNameChange}
        placeholder="Search by set name"
        autoFocus
      />
      <SearchField
        label="Set Code"
        value={localSetCode}
        onChange={handleSetCodeChange}
        placeholder="Search by set code"
      />
      <SetCategorySelector />
      <SetTypeSelector />
      {isCollectionPage && <CompletionStatusSelector />}
      <ToggleSwitch
        checked={reduxShowSubsets}
        onChange={handleShowSubsetsChange}
        name="showSubsets"
        label="Show subsets"
        tooltip={
          <div
            dangerouslySetInnerHTML={{
              __html:
                'Subsets are a piece of a larger set. <br /><br />Example: Tempest has subsets named Tempest Prerelease Promos and The List: Tempest.',
            }}
          />
        }
      />
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
    </>
  );
};

export default SetSearchFields;