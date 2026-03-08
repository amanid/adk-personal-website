"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface SubscriptionState {
  tier: string | null;
  status: string | null;
  hasDocumentAccess: boolean;
  hasDataAccess: boolean;
  cancelAtPeriodEnd: boolean;
  isLoading: boolean;
}

export function useSubscription(): SubscriptionState {
  const { data: session } = useSession();
  const [state, setState] = useState<SubscriptionState>({
    tier: null,
    status: null,
    hasDocumentAccess: false,
    hasDataAccess: false,
    cancelAtPeriodEnd: false,
    isLoading: true,
  });

  useEffect(() => {
    if (!session?.user) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    fetch("/api/subscription/status")
      .then((res) => res.json())
      .then((data) => {
        setState({
          tier: data.tier || null,
          status: data.status || null,
          hasDocumentAccess: data.hasDocumentAccess || false,
          hasDataAccess: data.hasDataAccess || false,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
          isLoading: false,
        });
      })
      .catch(() => {
        setState((s) => ({ ...s, isLoading: false }));
      });
  }, [session?.user]);

  return state;
}
