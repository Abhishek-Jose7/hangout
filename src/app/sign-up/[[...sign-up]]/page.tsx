import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join thousands of users planning perfect hangouts!
          </p>
        </div>
        <div className="flex justify-center">
          <SignUp 
            appearance={{
              variables: {
                colorPrimary: '#3B82F6',
              },
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white transition-colors',
                card: 'shadow-lg border-0',
                headerTitle: 'text-gray-900',
                headerSubtitle: 'text-gray-600',
                socialButtonsBlockButton: 'border border-gray-200 hover:bg-gray-50 transition-colors',
                socialButtonsBlockButtonText: 'text-gray-700',
                formFieldInput: 'border border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                footerActionLink: 'text-blue-600 hover:text-blue-700',
                identityPreviewText: 'text-gray-600',
                identityPreviewEditButton: 'text-blue-600 hover:text-blue-700',
              },
            }}
            signInUrl="/sign-in"
            redirectUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}
