'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { Clock, AlertTriangle, X } from 'lucide-react'
import { registerRateLimitHandler, unregisterRateLimitHandler } from '@/utils/rateLimitHandler'

interface RateLimitContextType {
    showRateLimitError: (retryAfter?: string) => void
    hideRateLimitError: () => void
}

const RateLimitContext = createContext<RateLimitContextType | null>(null)

export function useRateLimitError() {
    const context = useContext(RateLimitContext)
    if (!context) {
        throw new Error('useRateLimitError must be used within RateLimitProvider')
    }
    return context
}

interface RateLimitProviderProps {
    children: React.ReactNode
}

export function RateLimitProvider({ children }: RateLimitProviderProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [retryAfter, setRetryAfter] = useState<string>('15 minutes')
    const [countdown, setCountdown] = useState(0)

    const showRateLimitError = useCallback((retry?: string) => {
        setRetryAfter(retry || '15 minutes')
        setIsVisible(true)

        // Parse retry time and start countdown
        const match = retry?.match(/(\d+)\s*(minute|second|hour)/i)
        if (match) {
            const value = parseInt(match[1])
            const unit = match[2].toLowerCase()
            let seconds = value
            if (unit.includes('minute')) seconds = value * 60
            if (unit.includes('hour')) seconds = value * 3600
            setCountdown(seconds)
        }
    }, [])

    const hideRateLimitError = useCallback(() => {
        setIsVisible(false)
        setCountdown(0)
    }, [])

    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        setIsVisible(false)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [countdown])

    // Register global handler so API clients can trigger the modal
    useEffect(() => {
        registerRateLimitHandler(showRateLimitError)
        return () => unregisterRateLimitHandler()
    }, [showRateLimitError])

    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        if (mins > 0) {
            return `${mins}:${secs.toString().padStart(2, '0')}`
        }
        return `${secs}s`
    }

    return (
        <RateLimitContext.Provider value={{ showRateLimitError, hideRateLimitError }}>
            {children}

            {/* Rate Limit Modal */}
            {isVisible && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">Rate Limit Reached</h2>
                                        <p className="text-amber-100 text-sm">Please slow down</p>
                                    </div>
                                </div>
                                <button
                                    onClick={hideRateLimitError}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-4">
                                    <Clock size={40} className="text-amber-600" />
                                </div>
                                <p className="text-slate-600 leading-relaxed">
                                    You&apos;ve made too many requests in a short period.
                                    This is a security measure to protect our services.
                                </p>
                            </div>

                            {/* Countdown */}
                            {countdown > 0 && (
                                <div className="bg-slate-100 rounded-xl p-4 text-center mb-6">
                                    <p className="text-sm text-slate-500 mb-1">Try again in</p>
                                    <p className="text-3xl font-bold text-slate-900 font-mono">
                                        {formatCountdown(countdown)}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex items-start gap-3 text-sm text-slate-600">
                                    <span className="text-amber-500">•</span>
                                    <span>Wait {retryAfter} before making more requests</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm text-slate-600">
                                    <span className="text-amber-500">•</span>
                                    <span>Refresh the page after the countdown ends</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm text-slate-600">
                                    <span className="text-amber-500">•</span>
                                    <span>Contact support if this persists</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-50 px-6 py-4 flex gap-3">
                            <button
                                onClick={hideRateLimitError}
                                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-100 transition-colors"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                disabled={countdown > 0}
                                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${countdown > 0
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-teal-600 text-white hover:bg-teal-700'
                                    }`}
                            >
                                {countdown > 0 ? 'Please wait...' : 'Refresh Page'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </RateLimitContext.Provider>
    )
}

export default RateLimitProvider
