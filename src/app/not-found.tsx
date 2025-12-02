"use client";

import React from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 bg-indigo-100 rounded-full flex items-center justify-center">
          <span className="text-5xl">🔍</span>
        </div>
        <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-slate-600 mb-8">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="gradient" size="lg">
              Go to Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              My Groups
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
