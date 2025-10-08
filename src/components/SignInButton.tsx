"use client";
import { SignInButton as ClerkSignInButton, SignUpButton as ClerkSignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';

export default function AuthButtons() {
  return (
    <div className="flex gap-2">
      <SignedOut>
        <ClerkSignInButton mode="modal">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition-all duration-200">
            Sign In
          </button>
        </ClerkSignInButton>
        <ClerkSignUpButton mode="modal">
          <button className="border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 hover:border-blue-600 px-4 py-2 rounded font-semibold transition-all duration-200">
            Sign Up
          </button>
        </ClerkSignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}
