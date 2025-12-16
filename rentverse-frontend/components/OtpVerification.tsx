'use client'

import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react'
import { Shield, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

interface OtpVerificationProps {
    onVerify: (otp: string) => Promise<void>
    onResend: () => Promise<void>
    expiresAt: string
    email?: string
    isLoading?: boolean
    error?: string | null
}

export default function OtpVerification({
    onVerify,
    onResend,
    expiresAt,
    email,
    isLoading = false,
    error = null,
}: OtpVerificationProps) {
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
    const [isResending, setIsResending] = useState(false)
    const [resendSuccess, setResendSuccess] = useState(false)
    const [timeLeft, setTimeLeft] = useState<number>(0)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    // Calculate time remaining
    useEffect(() => {
        const calculateTimeLeft = () => {
            const expiry = new Date(expiresAt).getTime()
            const now = Date.now()
            const diff = Math.max(0, Math.floor((expiry - now) / 1000))
            setTimeLeft(diff)
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 1000)
        return () => clearInterval(timer)
    }, [expiresAt])

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Handle input change
    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (!/^\d*$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value.slice(-1) // Only take last digit
        setOtp(newOtp)

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }

        // Auto-submit when all digits entered
        if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
            onVerify(newOtp.join(''))
        }
    }

    // Handle keyboard navigation
    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus()
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    // Handle paste
    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)

        if (pastedData) {
            const newOtp = [...otp]
            for (let i = 0; i < pastedData.length; i++) {
                newOtp[i] = pastedData[i]
            }
            setOtp(newOtp)

            // Focus the next empty input or last input
            const nextEmptyIndex = newOtp.findIndex(d => d === '')
            const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex
            inputRefs.current[focusIndex]?.focus()

            // Auto-submit if all filled
            if (newOtp.every(d => d !== '')) {
                onVerify(newOtp.join(''))
            }
        }
    }

    // Handle resend
    const handleResend = async () => {
        setIsResending(true)
        setResendSuccess(false)
        try {
            await onResend()
            setResendSuccess(true)
            setOtp(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
            setTimeout(() => setResendSuccess(false), 3000)
        } finally {
            setIsResending(false)
        }
    }

    // Handle manual submit
    const handleSubmit = () => {
        const fullOtp = otp.join('')
        if (fullOtp.length === 6) {
            onVerify(fullOtp)
        }
    }

    const isExpired = timeLeft === 0
    const isComplete = otp.every(d => d !== '')

    return (
        <div className="flex flex-col items-center p-4 sm:p-8 bg-white rounded-2xl shadow-xl max-w-md mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-6">
                <Shield className="w-8 h-8 text-teal-600" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
                Verify Your Identity
            </h2>

            <p className="text-slate-600 text-center mb-6">
                We&apos;ve sent a 6-digit code to{' '}
                <span className="font-medium text-slate-900">
                    {email || 'your email'}
                </span>
            </p>

            {/* OTP Input */}
            <div className="flex gap-2 sm:gap-3 mb-6 justify-center w-full">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={el => { inputRefs.current[index] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleChange(index, e.target.value)}
                        onKeyDown={e => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        disabled={isLoading || isExpired}
                        className={`
              w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-lg border-2 
              transition-all duration-200 outline-none
              ${error
                                ? 'border-red-500 bg-red-50 text-red-600'
                                : digit
                                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                                    : 'border-slate-300 bg-white text-slate-900'
                            }
              focus:border-teal-500 focus:ring-2 focus:ring-teal-200
              disabled:bg-slate-100 disabled:cursor-not-allowed
            `}
                    />
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-4 w-full">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Success Message */}
            {resendSuccess && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg mb-4 w-full">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">A new code has been sent to your email</span>
                </div>
            )}

            {/* Timer */}
            <div className="flex items-center gap-2 mb-6">
                {isExpired ? (
                    <span className="text-red-500 text-sm font-medium">
                        Code expired
                    </span>
                ) : (
                    <span className="text-slate-500 text-sm">
                        Code expires in{' '}
                        <span className="font-mono font-medium text-teal-600">
                            {formatTime(timeLeft)}
                        </span>
                    </span>
                )}
            </div>

            {/* Verify Button */}
            <button
                onClick={handleSubmit}
                disabled={!isComplete || isLoading || isExpired}
                className={`
          w-full py-3 px-4 rounded-lg font-semibold text-white
          transition-all duration-200 mb-4
          ${isComplete && !isLoading && !isExpired
                        ? 'bg-teal-600 hover:bg-teal-700 cursor-pointer'
                        : 'bg-slate-300 cursor-not-allowed'
                    }
        `}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verifying...
                    </span>
                ) : (
                    'Verify Code'
                )}
            </button>

            {/* Resend */}
            <button
                onClick={handleResend}
                disabled={isResending || isLoading}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
                {isResending ? (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Sending...
                    </>
                ) : (
                    <>
                        <RefreshCw className="w-4 h-4" />
                        Resend Code
                    </>
                )}
            </button>
        </div>
    )
}
