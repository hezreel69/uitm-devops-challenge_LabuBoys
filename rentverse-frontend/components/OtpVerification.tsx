'use client'

import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react'
import { Lock, Mail, Clock, RotateCcw, XCircle, CheckCircle2, Sparkles } from 'lucide-react'

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
    const [focusedIndex, setFocusedIndex] = useState<number | null>(0)
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

    // Auto-focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus()
    }, [])

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Handle input change
    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value.slice(-1)
        setOtp(newOtp)

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
            setFocusedIndex(index + 1)
        }

        if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
            onVerify(newOtp.join(''))
        }
    }

    // Handle keyboard navigation
    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
            setFocusedIndex(index - 1)
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus()
            setFocusedIndex(index - 1)
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus()
            setFocusedIndex(index + 1)
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

            const nextEmptyIndex = newOtp.findIndex(d => d === '')
            const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex
            inputRefs.current[focusIndex]?.focus()
            setFocusedIndex(focusIndex)

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
            setFocusedIndex(0)
            setTimeout(() => setResendSuccess(false), 4000)
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
    const progress = (otp.filter(d => d !== '').length / 6) * 100

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
            <div className="w-full max-w-2xl">
                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header with gradient background */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-10 text-center relative overflow-hidden">
                        {/* Decorative circles */}
                        <div className="absolute top-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -translate-x-20 -translate-y-20"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full translate-x-16 translate-y-16"></div>
                        
                        <div className="relative z-10">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
                                <Lock className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Security Verification
                            </h1>
                            <p className="text-emerald-100 text-sm">
                                Enter the verification code we sent to
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-8 py-8">
                        {/* Email Display */}
                        <div className="flex items-center justify-center gap-3 mb-8 bg-gray-50 rounded-xl p-4">
                            <Mail className="w-5 h-5 text-emerald-600" />
                            <span className="font-semibold text-gray-800">
                                {email || 'your email'}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                                <span>Enter 6-digit code</span>
                                <span>{otp.filter(d => d !== '').length}/6</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* OTP Input */}
                        <div className="flex gap-3 mb-6 justify-center">
                            {otp.map((digit, index) => (
                                <div key={index} className="relative">
                                    <input
                                        ref={el => { inputRefs.current[index] = el }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handleChange(index, e.target.value)}
                                        onKeyDown={e => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        onFocus={() => setFocusedIndex(index)}
                                        onBlur={() => setFocusedIndex(null)}
                                        disabled={isLoading || isExpired}
                                        className={`
                                            w-14 h-16 text-center text-2xl font-bold rounded-xl
                                            transition-all duration-200 outline-none
                                            ${error
                                                ? 'border-2 border-red-400 bg-red-50 text-red-600 animate-shake'
                                                : digit
                                                    ? 'border-2 border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                                                    : focusedIndex === index
                                                        ? 'border-2 border-teal-400 bg-white shadow-lg'
                                                        : 'border-2 border-gray-200 bg-white'
                                            }
                                            disabled:bg-gray-100 disabled:cursor-not-allowed
                                            transform hover:scale-105
                                        `}
                                    />
                                    {digit && !error && (
                                        <div className="absolute -top-1 -right-1">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 fill-white" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Status Messages */}
                        {error && (
                            <div className="mb-6 animate-slide-down">
                                <div className="flex items-center gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-red-800">Verification Failed</p>
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {resendSuccess && (
                            <div className="mb-6 animate-slide-down">
                                <div className="flex items-center gap-3 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                                    <Sparkles className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-green-800">Code Sent!</p>
                                        <p className="text-sm text-green-600">Check your email for the new code</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Timer */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <Clock className={`w-5 h-5 ${isExpired ? 'text-red-500' : 'text-gray-400'}`} />
                            {isExpired ? (
                                <span className="text-red-500 font-semibold">
                                    Code expired - Please request a new one
                                </span>
                            ) : (
                                <span className="text-gray-600">
                                    Expires in{' '}
                                    <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-emerald-600'}`}>
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
                                w-full py-4 px-6 rounded-xl font-bold text-white text-lg
                                transition-all duration-200 transform
                                ${isComplete && !isLoading && !isExpired
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:scale-105 shadow-lg hover:shadow-xl'
                                    : 'bg-gray-300 cursor-not-allowed'
                                }
                            `}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Verifying your code...
                                </span>
                            ) : (
                                'Verify & Continue'
                            )}
                        </button>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">or</span>
                            </div>
                        </div>

                        {/* Resend Button */}
                        <button
                            onClick={handleResend}
                            disabled={isResending || isLoading}
                            className="w-full py-3 px-6 rounded-xl font-semibold text-emerald-600 border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <RotateCcw className={`w-5 h-5 ${isResending ? 'animate-spin' : ''}`} />
                            {isResending ? 'Sending new code...' : 'Resend verification code'}
                        </button>

                        {/* Help Text */}
                        <p className="text-center text-sm text-gray-500 mt-6">
                            Didn&apos;t receive the code? Check your spam folder or
                            <button className="text-emerald-600 hover:text-emerald-700 font-medium ml-1">
                                contact support
                            </button>
                        </p>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        🔒 Your security is our priority. This code will expire after use.
                    </p>
                </div>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                .animate-slide-down {
                    animation: slide-down 0.3s ease-out;
                }
            `}</style>
        </div>
    )
}
