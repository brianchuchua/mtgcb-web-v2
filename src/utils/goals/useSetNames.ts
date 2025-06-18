import { useMemo } from 'react';
import { useGetAllSetsQuery } from '@/api/sets/setsApi';

export function useSetNames(setIds: string[] | undefined) {
  const { data: setsResponse, isLoading: loading } = useGetAllSetsQuery();

  const setNames = useMemo(() => {
    if (!setIds || setIds.length === 0 || !setsResponse?.data?.sets) {
      return {};
    }

    const nameMap: Record<string, string> = {};
    setsResponse.data.sets.forEach((set) => {
      if (setIds.includes(set.id.toString())) {
        nameMap[set.id.toString()] = set.name;
      }
    });
    return nameMap;
  }, [setIds, setsResponse]);

  return { setNames, loading };
}