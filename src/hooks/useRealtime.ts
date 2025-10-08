'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { subscribeToGroupUpdates } from '@/lib/supabase';

export function useRealtime() {
  const [subscriptions, setSubscriptions] = useState<Map<string, unknown>>(new Map());
  const subscriptionsRef = useRef<Map<string, unknown>>(new Map());

  // Keep ref in sync with state
  useEffect(() => {
    subscriptionsRef.current = subscriptions;
  }, [subscriptions]);

  const subscribeToGroup = useCallback((groupId: string, onUpdate: (data: unknown) => void) => {
    // Check if already subscribed using ref to avoid dependency issues
    if (subscriptionsRef.current.has(groupId)) {
      return; // Already subscribed
    }

    const subscription = subscribeToGroupUpdates(groupId, (payload) => {
      console.log('Real-time update for group', groupId, ':', payload);
      onUpdate(payload);
    });

    if (subscription) {
      setSubscriptions(prev => {
        const newMap = new Map(prev);
        newMap.set(groupId, subscription);
        return newMap;
      });
    }
  }, []); // Empty dependency array to prevent infinite loops

  const unsubscribeFromGroup = useCallback((groupId: string) => {
    const subscription = subscriptionsRef.current.get(groupId);
    if (subscription && typeof subscription === 'object' && 'unsubscribe' in subscription) {
      (subscription as { unsubscribe: () => void }).unsubscribe();
      setSubscriptions(prev => {
        const newMap = new Map(prev);
        newMap.delete(groupId);
        return newMap;
      });
    }
  }, []); // Empty dependency array to prevent infinite loops

  const unsubscribeFromAll = useCallback(() => {
    subscriptionsRef.current.forEach((subscription) => {
      if (subscription && typeof subscription === 'object' && 'unsubscribe' in subscription) {
        (subscription as { unsubscribe: () => void }).unsubscribe();
      }
    });
    setSubscriptions(new Map());
  }, []); // Empty dependency array to prevent infinite loops

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Use ref directly to avoid dependency issues
      subscriptionsRef.current.forEach((subscription) => {
        if (subscription && typeof subscription === 'object' && 'unsubscribe' in subscription) {
          (subscription as { unsubscribe: () => void }).unsubscribe();
        }
      });
    };
  }, []); // Empty dependency array

  return {
    subscribeToGroup,
    unsubscribeFromGroup,
    unsubscribeFromAll,
    isSubscribed: (groupId: string) => subscriptions.has(groupId)
  };
}
