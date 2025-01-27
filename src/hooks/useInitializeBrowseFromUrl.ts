import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setSearchName, setOracleText } from '@/redux/slices/browseSlice';

export const useInitializeBrowseFromUrl = () => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  useEffect(() => {
    const name = searchParams.get('name');
    if (name) {
      dispatch(setSearchName(name));
    }

    const oracleText = searchParams.get('oracleText');
    if (oracleText) {
      dispatch(setOracleText(oracleText));
    }
  }, [dispatch, searchParams]);
};