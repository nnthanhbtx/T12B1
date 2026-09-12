import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-badge"
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-300/60 pointer-events-none animate-pulse"
    >
      <WifiOff size={14} className="text-slate-950 shrink-0" />
      <span>Đang chạy offline (Không cần Wifi)</span>
    </div>
  );
};
