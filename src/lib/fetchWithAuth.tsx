"use client";
import { useAuthContext } from '@/components/AuthProvider';

export function useFetchWithAuth() {
  const { getIdToken } = useAuthContext();

  return async (input: RequestInfo, init?: RequestInit) => {
    const token = getIdToken ? await getIdToken() : null;
    const headers = new Headers(init?.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  };
}
