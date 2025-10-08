"use client";

// This hook is no longer needed since Clerk handles authentication in API routes
// The middleware automatically protects routes and Clerk's auth() function
// provides user context in API routes

export function useFetchWithAuth() {
  // For client-side requests that need authentication, use this pattern:
  // const { getToken } = useAuth();
  // const token = await getToken();
  // Then include the token in headers when making requests to protected API routes

  return async (input: RequestInfo, init?: RequestInit) => {
    // This is a placeholder - in practice, you'd use Clerk's getToken() hook
    // on the client side when making authenticated requests
    return fetch(input, init);
  };
}
