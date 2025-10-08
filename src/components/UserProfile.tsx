'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useUser, useAuth } from '@clerk/nextjs';
import Button from './ui/Button';
import { useNotifications } from './NotificationProvider';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { addNotification } = useNotifications();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      addNotification({
        type: 'success',
        title: 'Signed Out',
        message: 'You have been successfully signed out.',
        duration: 3000,
      });
      onClose();
    } catch {
      addNotification({
        type: 'error',
        title: 'Sign Out Failed',
        message: 'Failed to sign out. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Profile Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt="Profile"
                width={80}
                height={80}
                className="w-20 h-20 rounded-full ring-4 ring-blue-100 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center ring-4 ring-blue-100 shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {(user.firstName || user.username || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-1">
            {user.firstName || user.username || 'Anonymous User'}
          </h2>
          <p className="text-gray-600 text-sm">
            {user.emailAddresses && user.emailAddresses.length > 0 ? user.emailAddresses[0].emailAddress : 'No email'}
          </p>
          {user.emailAddresses && user.emailAddresses.length > 0 && (
            <span className="inline-flex items-center mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified
            </span>
          )}
        </div>

        {/* Profile Details */}
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Account Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">User ID:</span>
                <span className="font-mono text-gray-800">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Provider:</span>
                <span className="text-gray-800">Google OAuth</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Sign In:</span>
                <span className="text-gray-800">
                  {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Privacy & Security</h3>
            <p className="text-sm text-blue-700">
              Your account is secured with Google&apos;s authentication system. We only store your group membership data locally.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleSignOut}
            loading={isSigningOut}
            fullWidth
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            leftIcon={
              !isSigningOut ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              ) : undefined
            }
          >
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </Button>

          <Button
            onClick={onClose}
            fullWidth
            variant="ghost"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
