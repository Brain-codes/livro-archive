"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiGet } from "@/lib/api/client";
import type { AuthedUser } from "@/types/auth";

export function useSession() {
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function resolve() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await apiGet<AuthedUser>("auth-profile/me");
      setUser(res.data ?? null);
      setLoading(false);
    }

    resolve();
    const { data: sub } = supabase.auth.onAuthStateChange(() => resolve());
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loading };
}
