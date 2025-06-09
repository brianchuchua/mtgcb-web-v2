import { useState, useEffect } from 'react';

interface SetInfo {
  id: number;
  name: string;
  code: string;
}

export function useSetNames(setIds: string[] | undefined) {
  const [setNames, setSetNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!setIds || setIds.length === 0) {
      setSetNames({});
      return;
    }

    const fetchSetNames = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL}/sets/all`);
        const data = await response.json();

        if (data.success && data.data.sets) {
          const nameMap: Record<string, string> = {};
          data.data.sets.forEach((set: SetInfo) => {
            if (setIds.includes(set.id.toString())) {
              nameMap[set.id.toString()] = set.name;
            }
          });
          setSetNames(nameMap);
        }
      } catch (error) {
        console.error('Error fetching set names:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSetNames();
  }, [setIds?.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { setNames, loading };
}