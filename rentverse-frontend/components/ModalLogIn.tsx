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
    <div className={clsx([
      isModal ? 'shadow-xl' : 'border border-slate-400',
      'bg-white rounded-3xl max-w-md w-full p-8',
    ])}>
      <div className="text-center py-8">
        {/* Animated Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full animate-ping opacity-20"></div>
          </div>
        </div>

        {/* Welcome Message */}
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          Welcome Back! 👋
        </h2>
        <p className="text-slate-600 mb-6">
          {user?.firstName ? `Great to see you, ${user.firstName}!` : 'You have successfully logged in.'}
        </p>

        {/* Security Badge */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-3">
            <Shield className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">
              Secure login verified
            </span>
          </div>
        </div>

        {/* Redirect Notice */}
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Taking you home...</span>
        </div>
      </div>
    </div>
  )

  // Show success screen if login/MFA verification was successful
  if (loginSuccess) {
    if (isModal) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          {successContent}
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center p-4">
        {successContent}
      </div>
    )
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

