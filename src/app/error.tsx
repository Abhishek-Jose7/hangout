"use client";

import React from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function Error({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string }; 
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Something went wrong
        </h1>
        <p className="text-slate-600 mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="gradient">
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline">
              Go to Home
            </Button>
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="mt-4 text-xs text-slate-400">
            Error digest: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
