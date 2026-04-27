import { useEffect, useState } from 'react';
import { ensureUser, type LocalSession } from '../session';

export function useSession() {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    ensureUser()
      .then((s) => { if (!cancelled) setSession(s); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { session, setSession, loading };
}
