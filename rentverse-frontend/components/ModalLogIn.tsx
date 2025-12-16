'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import React, { ChangeEvent } from 'react'
import { ArrowLeft, CheckCircle, Shield } from 'lucide-react'
import BoxError from '@/components/BoxError'
import InputPassword from '@/components/InputPassword'
import ButtonFilled from '@/components/ButtonFilled'
import OtpVerification from '@/components/OtpVerification'
import useAuthStore from '@/stores/authStore'

interface ModalLogInProps {
  isModal?: boolean
}

function ModalLogIn({ isModal = true }: ModalLogInProps) {
  const {
    password,
    isLoading,
    error,
    mfaRequired,
    mfaExpiresAt,
    mfaEmail,
    loginSuccess,
    user,
    setPassword,
    isLoginFormValid,
    submitLogIn,
    verifyMfa,
    resendMfa,
    cancelMfa,
  } = useAuthStore()
  const router = useRouter()

  const handleBackButton = () => {
    if (mfaRequired) {
      cancelMfa()
    } else {
      router.back()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitLogIn()
  }

  const handleVerifyOtp = async (otp: string) => {
    await verifyMfa(otp)
  }

  const handleResendOtp = async () => {
    await resendMfa()
  }

  // Login Success Screen
  const successContent = (
    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Confetti-like decorative background */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-12 text-center relative overflow-hidden">
          {/* Animated circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-x-16 -translate-y-16 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full translate-x-20 translate-y-20 animate-pulse delay-75"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white opacity-5 rounded-full -translate-x-12 -translate-y-12"></div>
          
          <div className="relative z-10">
            {/* Success Icon with Animation */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
                  <CheckCircle className="w-16 h-16 text-emerald-500" strokeWidth={2.5} />
                </div>
                {/* Ripple effect */}
                <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-25"></div>
                <div className="absolute inset-0 bg-white rounded-full animate-pulse opacity-20"></div>
              </div>
            </div>

            {/* Welcome Message */}
            <h1 className="text-4xl font-bold text-white mb-3 animate-fade-in">
              Welcome Back! 🎉
            </h1>
            <p className="text-emerald-50 text-lg animate-fade-in-delay">
              {user?.firstName 
                ? `Great to see you again, ${user.firstName}!` 
                : 'You have successfully logged in to your account'}
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-8 py-10">
          {/* Security Badge */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 mb-8 animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-emerald-900 mb-1">
                  Secure Login Verified
                </h3>
                <p className="text-sm text-emerald-700">
                  Your identity has been confirmed successfully
                </p>
              </div>
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8 animate-slide-up-delay">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600 mb-1">✓</div>
              <div className="text-xs text-gray-600">MFA Verified</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-teal-600 mb-1">🔒</div>
              <div className="text-xs text-gray-600">Data Encrypted</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-cyan-600 mb-1">🛡️</div>
              <div className="text-xs text-gray-600">Session Secure</div>
            </div>
          </div>

          {/* Loading Indicator */}
          <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="relative">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-8 h-8 border-4 border-teal-300 border-t-transparent rounded-full animate-spin-slow opacity-30"></div>
              </div>
              <span className="text-lg font-semibold text-emerald-800">
                Preparing your dashboard...
              </span>
            </div>
            <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full animate-loading-bar"></div>
            </div>
          </div>

          {/* Additional Info */}
          <p className="text-center text-sm text-gray-500 mt-6">
            You will be redirected to your dashboard in a moment
          </p>
        </div>

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes loading-bar {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-bounce-slow {
            animation: bounce-slow 2s ease-in-out infinite;
          }
          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }
          .animate-fade-in-delay {
            animation: fade-in 0.6s ease-out 0.2s backwards;
          }
          .animate-slide-up {
            animation: slide-up 0.5s ease-out 0.3s backwards;
          }
          .animate-slide-up-delay {
            animation: slide-up 0.5s ease-out 0.5s backwards;
          }
          .animate-loading-bar {
            animation: loading-bar 2.5s ease-in-out;
          }
          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }
          .delay-75 {
            animation-delay: 75ms;
          }
        `}</style>
      </div>
    </div>
  )

  // Show success screen if login/MFA verification was successful
  if (loginSuccess) {
    // Success screen is now full-screen, no modal wrapper needed
    return successContent
  }

  // MFA Verification Screen
  const mfaContent = (
    <div className={clsx([
      isModal ? 'shadow-xl' : 'border border-slate-400',
      'bg-white rounded-3xl max-w-md w-full p-8',
    ])}>
      {/* Header */}
      <div className="text-center mb-2 relative">
        <ArrowLeft onClick={handleBackButton} size={20}
          className="absolute left-0 top-1 text-slate-800 cursor-pointer hover:text-slate-600" />
      </div>

      {/* OTP Verification Component */}
      <OtpVerification
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        expiresAt={mfaExpiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString()}
        email={mfaEmail || undefined}
        isLoading={isLoading}
        error={error}
      />
    </div>
  )

  // Login Form Screen
  const containerContent = (
    <div className={clsx([
      isModal ? 'shadow-xl' : 'border border-slate-400',
      'bg-white rounded-3xl max-w-md w-full p-8',
    ])}>
      {/* Header */}
      <div className="text-center mb-6 relative">
        <ArrowLeft onClick={handleBackButton} size={20}
          className="absolute left-0 top-1 text-slate-800 cursor-pointer hover:text-slate-600" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Log in
        </h2>
        <div className="w-full h-px bg-slate-200 mt-4"></div>
      </div>

      {/* Content */}
      <div className="mb-8">
        {/* Alert box - only show when there's an error */}
        {error && (
          <div className="mb-6">
            <BoxError errorTitle={'Let\'s try that again'} errorDescription={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Section */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-900 mb-3">
              Password
            </label>
            <InputPassword
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Password"
              required
              showStrengthIndicator={false}
            />
          </div>

          {/* Submit Button */}
          <ButtonFilled
            type="submit"
            disabled={!isLoginFormValid() || isLoading}
          >
            {isLoading ? 'Loading...' : 'Log in'}
          </ButtonFilled>

          <div className="text-center">
            <Link href={'/'} className={'underline text-slate-700 text-sm hover:text-slate-900 transition-colors'}>
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )

  // Choose which content to show
  const content = mfaRequired ? mfaContent : containerContent

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        {content}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-4">
      {content}
    </div>
  )
}

export default ModalLogIn

