import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hangout - Plan the Perfect Meetup Together',
  description: 'Create or join groups, find the best meetup spots, and decide together — all in one place. Smart location suggestions, group voting, and real-time coordination.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if required keys are properly configured (not placeholders)
  const hasValidClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_placeholder_key' &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_YOUR_CLERK_PUBLISHABLE_KEY' &&
    (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_test_') || 
     process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_live_')) &&
    process.env.CLERK_SECRET_KEY &&
    process.env.CLERK_SECRET_KEY !== 'sk_test_placeholder_key' &&
    process.env.CLERK_SECRET_KEY !== 'sk_test_YOUR_CLERK_SECRET_KEY' &&
    (process.env.CLERK_SECRET_KEY.startsWith('sk_test_') || 
     process.env.CLERK_SECRET_KEY.startsWith('sk_live_'));

  const hasValidSupabaseKeys = process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder_anon_key';

  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${inter.className} min-h-screen bg-white`}>
        {hasValidClerkKeys && hasValidSupabaseKeys ? (
          <ClerkProvider
            appearance={{
              variables: {
                colorPrimary: '#3B82F6',
              },
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
                card: 'shadow-lg',
                headerTitle: 'text-gray-900',
                headerSubtitle: 'text-gray-600',
                socialButtonsBlockButton: 'border border-gray-200 hover:bg-gray-50',
                socialButtonsBlockButtonText: 'text-gray-700',
                formFieldInput: 'border border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                footerActionLink: 'text-blue-600 hover:text-blue-700',
              },
            }}
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
          >
          {children}
          </ClerkProvider>
        ) : (
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center p-8 max-w-md mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">🔐 Setup Required</h1>
              <p className="text-gray-600 mb-6">
                Please configure your API keys in the <code>.env.local</code> file to continue.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg text-left text-sm">
                <p className="font-semibold mb-2">Required environment variables:</p>
                <ul className="space-y-1 text-gray-700 mb-4">
                  <li>• <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> (Clerk)</li>
                  <li>• <code>CLERK_SECRET_KEY</code> (Clerk)</li>
                  <li>• <code>NEXT_PUBLIC_SUPABASE_URL</code> (Supabase)</li>
                  <li>• <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (Supabase)</li>
                </ul>
                <p className="text-gray-600">
                  Get Clerk keys from <a href="https://dashboard.clerk.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Clerk dashboard</a><br/>
                  Get Supabase keys from <a href="https://supabase.com/dashboard" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Supabase dashboard</a>
                </p>
              </div>
              <div className="mt-6 text-xs text-gray-500">
                The application is ready! Just add your API keys to start using authentication and data storage.
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
