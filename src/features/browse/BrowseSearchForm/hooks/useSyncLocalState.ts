import { useEffect } from 'react';

interface UseSyncLocalStateProps {
  reduxCardName: string;
  reduxSetName: string;
  reduxSetCode: string;
  reduxOracleText: string;
  reduxArtist: string;
  setLocalCardName: (value: string) => void;
  setLocalSetName: (value: string) => void;
  setLocalSetCode: (value: string) => void;
  setLocalOracleText: (value: string) => void;
  setLocalArtist: (value: string) => void;
}

export const useSyncLocalState = ({
  reduxCardName,
  reduxSetName,
  reduxSetCode,
  reduxOracleText,
  reduxArtist,
  setLocalCardName,
  setLocalSetName,
  setLocalSetCode,
  setLocalOracleText,
  setLocalArtist,
}: UseSyncLocalStateProps) => {
  useEffect(() => {
    setLocalCardName(reduxCardName);
  }, [reduxCardName, setLocalCardName]);

  useEffect(() => {
    setLocalSetName(reduxSetName);
  }, [reduxSetName, setLocalSetName]);

  useEffect(() => {
    setLocalSetCode(reduxSetCode);
  }, [reduxSetCode, setLocalSetCode]);

  useEffect(() => {
    setLocalOracleText(reduxOracleText);
  }, [reduxOracleText, setLocalOracleText]);

  useEffect(() => {
    setLocalArtist(reduxArtist);
  }, [reduxArtist, setLocalArtist]);
};