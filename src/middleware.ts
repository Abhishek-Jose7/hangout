import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/group(.*)',
  '/create(.*)',
  '/date(.*)'
]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default clerkMiddleware((_auth, _req) => {
  // Route protection handled by individual pages
}, {
  // Safari-compatible configuration
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/dashboard',
  // Ensure compatibility with Safari's third-party cookie restrictions
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};