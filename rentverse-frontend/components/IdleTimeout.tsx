'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/stores/authStore';

interface IdleTimerProps {
  timeoutMs?: number;
  onIdle?: () => void;
  enabled?: boolean;
}

/**
 * IdleTimer Hook
 * Tracks user activity and triggers callback when user is idle
 */
export function useIdleTimer({ 
  timeoutMs = 15 * 60 * 1000, // 15 minutes
  //timeoutMs = 10000, // 10 seconds default
  onIdle,
  enabled = true 
}: IdleTimerProps = {}) {
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isIdleRef = useRef(false);

  const resetTimer = useCallback(() => {
    // Clear existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Reset idle state
    isIdleRef.current = false;

    // Set new timer
    if (enabled) {
      idleTimerRef.current = setTimeout(() => {
        isIdleRef.current = true;
        console.log('[IDLE] User has been idle for', timeoutMs / 1000, 'seconds');
        onIdle?.();
      }, timeoutMs);
    }
  }, [timeoutMs, onIdle, enabled]);

  useEffect(() => {
    if (!enabled) {
      // Clear timer if disabled
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      return;
    }

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Reset timer on any activity
    const handleActivity = () => {
      if (isIdleRef.current) {
        console.log('[IDLE] User became active again');
      }
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [enabled, resetTimer]);
}

/**
 * IdleTimeout Component
 * Automatically logs out user after period of inactivity
 */
interface IdleTimeoutProps {
  timeoutSeconds?: number;
}

export default function IdleTimeout({ timeoutSeconds = 10 }: IdleTimeoutProps) {
  const router = useRouter();
  const { isLoggedIn, logout } = useAuthStore();
  const hasShownModalRef = useRef(false);

  const handleIdle = useCallback(() => {
    // Only proceed if user is logged in and modal hasn't been shown
    if (!isLoggedIn || hasShownModalRef.current) return;

    console.log('[IDLE] Session expired due to inactivity');
    hasShownModalRef.current = true;

    // Show session expired modal
    const event = new CustomEvent('session-expired', {
      detail: { reason: 'inactivity', seconds: timeoutSeconds }
    });
    window.dispatchEvent(event);

    // Logout user
    setTimeout(() => {
      logout();
      router.push('/auth');
    }, 100);
  }, [isLoggedIn, logout, router, timeoutSeconds]);

  useIdleTimer({
    timeoutMs: timeoutSeconds * 1000,
    onIdle: handleIdle,
    enabled: isLoggedIn,
  });

  // Reset modal flag when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      hasShownModalRef.current = false;
    }
  }, [isLoggedIn]);

  return null; // No UI, just functionality
}
