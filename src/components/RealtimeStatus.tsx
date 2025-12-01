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
        color: 'bg-emerald-500',
        text: 'Live Updates Active',
        description: 'Connected via WebSocket'
      };
    } else if (isSocketAvailable === false) {
      return {
        status: 'supabase',
        color: 'bg-amber-500',
        text: 'Live Updates Active',
        description: 'Connected via Database'
      };
    } else {
      return {
        status: 'connecting',
        color: 'bg-slate-400',
        text: 'Connecting...',
        description: 'Establishing connection'
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex items-center space-x-2.5 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200/60 shadow-sm">
      <div className="relative flex h-2.5 w-2.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusInfo.color}`}></span>
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusInfo.color}`}></span>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-xs font-semibold text-slate-700">{statusInfo.text}</span>
        {groupId && isSubscribed(groupId) && (
          <span className="text-[10px] text-indigo-600 font-medium mt-0.5">Syncing group data...</span>
        )}
      </div>
    </div>
  );
}
