'use client';

import { useEffect, useState } from 'react';
import { Clock, LogOut } from 'lucide-react';

export default function SessionExpiredModal() {
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState<'inactivity' | 'expired'>('inactivity');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent<{ reason: 'inactivity' | 'expired'; seconds: number }>;
      setReason(customEvent.detail.reason);
      setSeconds(customEvent.detail.seconds);
      setShow(true);
    };

    window.addEventListener('session-expired', handleSessionExpired as EventListener);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired as EventListener);
    };
  }, []);

  if (!show) return null;

  const handleClose = () => {
    setShow(false);
    // Redirect happens automatically from IdleTimeout component
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in duration-200" />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-red-200 max-w-md w-full overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                <div className="relative bg-white/90 backdrop-blur-sm p-4 rounded-full">
                  <Clock size={40} className="text-red-600" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Session Expired
            </h2>
            <p className="text-white/90 text-sm">
              Your session has ended
            </p>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <div className="mb-6 space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-semibold">
                <LogOut size={16} />
                <span>
                  {reason === 'inactivity' 
                    ? `Idle for ${seconds} seconds`
                    : 'Session timeout'}
                </span>
              </div>
              
              <p className="text-slate-600 leading-relaxed">
                {reason === 'inactivity' 
                  ? `You've been inactive for ${seconds} seconds. For your security, we've automatically logged you out.`
                  : 'Your session has expired. Please log in again to continue.'}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                You'll be redirected to the login page
              </p>
              
              <button
                onClick={handleClose}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:shadow-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                <span>Go to Login</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t-2 border-slate-100">
            <p className="text-xs text-slate-500 text-center">
              💡 Tip: Stay active to keep your session alive
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
