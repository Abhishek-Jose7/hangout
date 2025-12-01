"use client";
import { SignInButton as ClerkSignInButton, SignUpButton as ClerkSignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Button from './ui/Button';

export default function AuthButtons() {
  return (
    <div className="flex gap-3">
      <SignedOut>
        <ClerkSignInButton mode="modal">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </ClerkSignInButton>
        <ClerkSignUpButton mode="modal">
          <Button variant="primary" size="sm">
            Sign Up
          </Button>
        </ClerkSignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}
