"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@/types/auth";

export interface UseAuthResult {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refetch: () => Promise<User | null>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    const nextUser = await getCurrentUser();
    setUser(nextUser);
    setLoading(false);
    return nextUser;
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    refetch: fetchUser,
  };
}
