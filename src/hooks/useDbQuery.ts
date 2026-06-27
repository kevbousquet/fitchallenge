import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useDbQuery<T>(
  queryFn: () => Promise<T>,
  initialValue: T,
  deps: unknown[],
): T {
  const [data, setData] = useState<T>(initialValue);
  const dbVersion = useStore((s) => s.dbVersion);

  useEffect(() => {
    let cancelled = false;
    queryFn().then((result) => {
      if (!cancelled) setData(result);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, dbVersion]);

  return data;
}
