"use client";

import Link from 'next/link';
import Button from '@/components/ui/Button';
import { LoginButton } from '@/components/LoginButton';
import { useAuthContext } from '@/components/AuthProvider';

export default function Home() {
  const { } = useAuthContext();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-blue-100">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">Group Meetup Planner</h1>
          <LoginButton />
        </div>
        
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Create a New Group</h2>
            <p className="text-gray-600 mb-5">
              Start a new group and invite others to join with your unique code.
            </p>
            <Link href="/create" className="block">
              <Button 
                fullWidth 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg py-3"
              >
                Create Group
              </Button>
            </Link>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Join an Existing Group</h2>
            <p className="text-gray-600 mb-5">
              Enter a group code to join others who are planning a meetup.
            </p>
            <Link href="/join" className="block">
              <Button 
                variant="outline" 
                fullWidth
                className="border-2 border-blue-300 hover:bg-blue-50 text-lg py-3"
              >
                Join Group
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
