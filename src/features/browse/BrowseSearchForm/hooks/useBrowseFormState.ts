import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import debounce from 'lodash.debounce';
import {
  selectArtist,
  selectCardSearchName,
  selectOracleText,
  selectSetCode,
  selectSetSearchName,
  setArtist,
  setCardSearchName,
  setOracleText,
  setSetCode,
  setSetSearchName,
} from '@/redux/slices/browseSlice';

export const useBrowseFormState = () => {
  const dispatch = useDispatch();

  const reduxCardName = useSelector(selectCardSearchName) || '';
  const reduxSetName = useSelector(selectSetSearchName) || '';
  const reduxSetCode = useSelector(selectSetCode) || '';
  const reduxOracleText = useSelector(selectOracleText) || '';
  const reduxArtist = useSelector(selectArtist) || '';

  const [localCardName, setLocalCardName] = useState(reduxCardName);
  const [localSetName, setLocalSetName] = useState(reduxSetName);
  const [localSetCode, setLocalSetCode] = useState(reduxSetCode);
  const [localOracleText, setLocalOracleText] = useState(reduxOracleText);
  const [localArtist, setLocalArtist] = useState(reduxArtist);

  const debouncedCardNameDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setCardSearchName(value));
    }, 300),
    [dispatch],
  );

  const debouncedSetNameDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setSetSearchName(value));
    }, 300),
    [dispatch],
  );

  const debouncedSetCodeDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setSetCode(value));
    }, 300),
    [dispatch],
  );

  const debouncedOracleDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setOracleText(value));
    }, 300),
    [dispatch],
  );

  const debouncedArtistDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setArtist(value));
    }, 300),
    [dispatch],
  );

  const handleCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalCardName(newValue);
    debouncedCardNameDispatch(newValue);
  };

  const handleSetNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalSetName(newValue);
    debouncedSetNameDispatch(newValue);
  };

  const handleSetCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalSetCode(newValue);
    debouncedSetCodeDispatch(newValue);
  };

  const handleOracleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalOracleText(newValue);
    debouncedOracleDispatch(newValue);
  };

  const handleArtistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalArtist(newValue);
    debouncedArtistDispatch(newValue);
  };

  return {
    localCardName,
    localSetName,
    localSetCode,
    localOracleText,
    localArtist,
    setLocalCardName,
    setLocalSetName,
    setLocalSetCode,
    setLocalOracleText,
    setLocalArtist,
    handleCardNameChange,
    handleSetNameChange,
    handleSetCodeChange,
    handleOracleChange,
    handleArtistChange,
  };
};