'use client';

import { useSocket } from '@/hooks/useSocket';
import { useRealtime } from '@/hooks/useRealtime';

interface RealtimeStatusProps {
  groupId?: string;
}

export default function RealtimeStatus({ groupId }: RealtimeStatusProps) {
  const { isSocketAvailable, isConnected } = useSocket();
  const { isSubscribed } = useRealtime();

  const getStatusInfo = () => {
    if (isSocketAvailable === true && isConnected) {
      return {
        status: 'active',
        color: 'bg-green-500',
        text: 'Real-time updates active (Socket.io)',
        description: 'Instant updates via WebSocket connection'
      };
    } else if (isSocketAvailable === false) {
      return {
        status: 'supabase',
        color: 'bg-yellow-500',
        text: 'Real-time updates via Supabase',
        description: 'Database-level subscriptions (works on Vercel)'
      };
    } else {
      return {
        status: 'connecting',
        color: 'bg-gray-400',
        text: 'Connecting...',
        description: 'Establishing real-time connection'
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${statusInfo.color} animate-pulse`}></div>
      <div>
        <span className="text-gray-700 font-medium">{statusInfo.text}</span>
        <div className="text-xs text-gray-500">{statusInfo.description}</div>
        {groupId && isSubscribed(groupId) && (
          <div className="text-xs text-blue-600">✓ Subscribed to group updates</div>
        )}
      </div>
    </div>
  );
}
