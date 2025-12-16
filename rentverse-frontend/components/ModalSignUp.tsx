'use client'

import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import React, { ChangeEvent } from 'react'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import ButtonFilled from '@/components/ButtonFilled'
import InputEmail from '@/components/InputEmail'
import InputName from '@/components/InputName'
import InputDate from '@/components/InputDate'
import InputPassword from '@/components/InputPassword'
import InputPhone from '@/components/InputPhone'
import useAuthStore from '@/stores/authStore'
import BoxError from '@/components/BoxError'

interface ModalSignUpProps {
  isModal?: boolean
}

function ModalSignUp({ isModal = true }: ModalSignUpProps) {
  const {
    firstName,
    lastName,
    birthdate,
    email,
    phone,
    signUpPassword,
    isLoading,
    error,
    signupSuccess,
    signupEmail,
    setFirstName,
    setLastName,
    setBirthdate,
    setEmail,
    setPhone,
    setSignUpPassword,
    isSignUpFormValid,
    submitSignUp,
  } = useAuthStore()
  const router = useRouter()

  const handleBackButton = () => {
    router.back()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitSignUp()
  }

  // Success screen content
  const successContent = (
    <div className={clsx([
      isModal ? 'shadow-xl' : 'border border-slate-400',
      'bg-white rounded-3xl max-w-md w-full p-8',
    ])}>
      <div className="text-center py-8">
        {/* Animated Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full animate-ping opacity-20"></div>
          </div>
        </div>

        {/* Success Message */}
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          Welcome to RentVerse! 🎉
        </h2>
        <p className="text-slate-600 mb-2">
          Your account has been created successfully.
        </p>
        <p className="text-sm text-slate-500 mb-6">
          We&apos;ve sent you an email at <span className="font-medium text-slate-700">{signupEmail}</span>
        </p>

        {/* Security Notice */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔐</span>
            <div className="text-left">
              <p className="text-sm font-medium text-amber-800">
                Enhanced Security Enabled
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Two-factor authentication is enabled for your account. You&apos;ll receive a verification code each time you log in.
              </p>
            </div>
          </div>
        </div>

        {/* Redirect Notice */}
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Redirecting to login...</span>
        </div>
      </div>
    </div>
  )

  // Show success screen if signup was successful
  if (signupSuccess) {
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
          Finish sign up
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
          {/* Legal name Section */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-3">
              Legal name
            </label>
            <InputName
              firstName={firstName}
              lastName={lastName}
              onFirstNameChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
              onLastNameChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-2">
              Make sure this matches the name on your government ID. If you go by another name, you can add a preferred
              first name.
            </p>
          </div>

          {/* Date of birth Section */}
          <div>
            <label htmlFor="birth" className="block text-sm font-medium text-slate-900 mb-3">
              Date of birth
            </label>
            <InputDate
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              required
            />
            <p className="text-xs text-slate-500 mt-2">
              To sign up, you need to be at least 18. Your birthday won&apos;t be shared with other people who use
              Rentverse.
            </p>
          </div>

          {/* Contact info Section */}
          <div>
            <label htmlFor="contactInfo" className="block text-sm font-medium text-slate-900 mb-3">
              Contact info
            </label>
            <div className="space-y-4">
              <InputEmail
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="me@email.com"
                required
              />
              <InputPhone
                value={phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                placeholder="Phone number"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              We&apos;ll email you rent confirmations and receipts. We may also contact you via phone for important updates.
            </p>
          </div>

          {/* Password Section */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-900 mb-3">
              Password
            </label>
            <InputPassword
              value={signUpPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSignUpPassword(e.target.value)}
              placeholder="Password"
              required
              showStrengthIndicator={true}
            />
          </div>

          {/* Terms and Conditions */}
          <div className="text-xs text-slate-600 leading-relaxed">
            By selecting Agree and continue, I agree to Rentverse&apos;s{' '}
            <a href="#" className="text-teal-600 hover:underline">Terms of Service</a>,{' '}
            <a href="#" className="text-teal-600 hover:underline">Payments Terms of Service</a>, and{' '}
            <a href="#" className="text-teal-600 hover:underline">Nondiscrimination Policy</a>{' '}
            and acknowledge the{' '}
            <a href="#" className="text-teal-600 hover:underline">Privacy Policy</a>.
          </div>

          {/* Submit Button */}
          <ButtonFilled
            type="submit"
            disabled={!isSignUpFormValid() || isLoading}
          >
            {isLoading ? 'Loading...' : 'Agree and continue'}
          </ButtonFilled>
        </form>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        {containerContent}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-4">
      {containerContent}
    </div>
  )
}

export default ModalSignUp
