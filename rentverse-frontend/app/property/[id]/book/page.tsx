'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import ButtonCircle from '@/components/ButtonCircle'
import { ArrowLeft, Plus, Minus, Check, Loader2, CreditCard } from 'lucide-react'
import { PropertiesApiClient } from '@/utils/propertiesApiClient'
import { Property } from '@/types/property'
import useAuthStore from '@/stores/authStore'
import { debugAuthState } from '@/utils/debugAuth'

// Payment method types
type PaymentMethod = 'visa' | 'mastercard' | 'paypal'

interface PaymentOption {
  id: PaymentMethod
  name: string
  icon: string
  bgColor: string
  textColor: string
}

const paymentOptions: PaymentOption[] = [
  { id: 'visa', name: 'Visa', icon: 'VISA', bgColor: 'bg-blue-600', textColor: 'text-white' },
  { id: 'mastercard', name: 'Mastercard', icon: 'MC', bgColor: 'bg-orange-500', textColor: 'text-white' },
  { id: 'paypal', name: 'PayPal', icon: 'PP', bgColor: 'bg-blue-500', textColor: 'text-white' },
]

function BookingPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string
  const { isLoggedIn } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoadingProperty, setIsLoadingProperty] = useState(true)

  // Payment method state
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('visa')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Form data state for booking
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    numGuests: 1,
    message: '',
    totalAmount: 0
  })

  // Duration counters (similar to searchbar)
  const [startMonthCount, setStartMonthCount] = useState(0) // Start month from now
  const [durationMonths, setDurationMonths] = useState(1) // Duration in months

  // Helper function to get property price as number
  const getPropertyPrice = useCallback(() => {
    if (!property) return 0
    return typeof property.price === 'string' ? parseFloat(property.price) : property.price
  }, [property])

  // Update actual dates based on month counters
  const updateDatesFromCounters = useCallback((startMonth: number, duration: number) => {
    const currentDate = new Date()

    // For start month calculation, ensure we don't go to the past
    let startDate: Date
    if (startMonth === 0) {
      // If starting "this month", use tomorrow or today (whichever is later)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      startDate = tomorrow
    } else {
      // For future months, use the 1st of that month
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + startMonth, 1)
    }

    // Calculate end date by adding duration months to start date
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + duration, 0) // Last day of the end month

    // Calculate total amount based on duration and property price
    const monthlyPrice = getPropertyPrice()
    const totalAmount = monthlyPrice * duration

    setFormData(prev => ({
      ...prev,
      checkIn: startDate.toISOString().split('T')[0],
      checkOut: endDate.toISOString().split('T')[0],
      totalAmount: totalAmount
    }))
  }, [getPropertyPrice])

  // Helper functions for month counters
  const incrementStartMonth = () => {
    setStartMonthCount(prev => prev + 1)
    updateDatesFromCounters(startMonthCount + 1, durationMonths)
  }

  const decrementStartMonth = () => {
    if (startMonthCount > 0) {
      setStartMonthCount(prev => prev - 1)
      updateDatesFromCounters(startMonthCount - 1, durationMonths)
    }
  }

  const incrementDuration = () => {
    setDurationMonths(prev => prev + 1)
    updateDatesFromCounters(startMonthCount, durationMonths + 1)
  }

  const decrementDuration = () => {
    if (durationMonths > 1) {
      setDurationMonths(prev => prev - 1)
      updateDatesFromCounters(startMonthCount, durationMonths - 1)
    }
  }

  // Format month display text
  const getStartMonthText = () => {
    const currentDate = new Date()
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + startMonthCount, 1)
    return targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const getDurationText = () => {
    return durationMonths === 1 ? '1 month' : `${durationMonths} months`
  }

  // Get selected payment option
  const getSelectedPaymentOption = () => {
    return paymentOptions.find(p => p.id === selectedPayment) || paymentOptions[0]
  }

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) return

      try {
        setIsLoadingProperty(true)
        const viewResponse = await PropertiesApiClient.logPropertyView(propertyId)

        if (viewResponse.success && viewResponse.data.property) {
          const backendProperty = viewResponse.data.property
          setProperty(backendProperty)

          // Set the initial total amount from property price
          const price = typeof backendProperty.price === 'string'
            ? parseFloat(backendProperty.price)
            : backendProperty.price
          setFormData(prev => ({ ...prev, totalAmount: price || 0 }))
        } else {
          setSubmitError('Failed to load property details')
          setProperty(null)
        }
      } catch (error) {
        console.error('Error fetching property:', error)
        setSubmitError('Failed to load property details. Please try again.')
        setProperty(null)
      } finally {
        setIsLoadingProperty(false)
      }
    }

    if (propertyId && propertyId !== 'undefined' && propertyId !== 'null') {
      fetchProperty()
    } else {
      setSubmitError('Property ID not found in URL')
      setIsLoadingProperty(false)
    }
  }, [propertyId])

  // Initialize dates on component mount
  useEffect(() => {
    const currentDate = new Date()
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

    setFormData(prev => ({
      ...prev,
      checkIn: startDate.toISOString().split('T')[0],
      checkOut: endDate.toISOString().split('T')[0],
      totalAmount: 0 // Will be updated when property loads
    }))
  }, [])

  // Update total amount when property loads or duration changes
  useEffect(() => {
    if (property) {
      updateDatesFromCounters(startMonthCount, durationMonths)
    }
  }, [property, startMonthCount, durationMonths, updateDatesFromCounters])

  const handleBack = () => {
    router.back()
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmitBooking = async () => {
    if (!formData.checkIn || !formData.checkOut) {
      setSubmitError('Please select booking dates')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const authStore = useAuthStore.getState()
      debugAuthState()

      if (!authStore.isLoggedIn) {
        setSubmitError('Please log in to make a booking')
        router.push('/auth')
        return
      }

      const token = localStorage.getItem('authToken')
      if (!token) {
        setSubmitError('Authentication token not found. Please log in again.')
        router.push('/auth')
        return
      }

      // Test token validity
      try {
        const authTestResponse = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!authTestResponse.ok) {
          setSubmitError('Token validation failed. Please log in again.')
          router.push('/auth')
          return
        }

        const authResult = await authTestResponse.json()
        if (!authResult.success) {
          setSubmitError('Authentication failed. Please log in again.')
          router.push('/auth')
          return
        }
      } catch (authError) {
        console.error('Auth test error:', authError)
        setSubmitError('Authentication check failed. Please try again.')
        return
      }

      // Prepare booking data
      const bookingData = {
        propertyId: propertyId,
        startDate: new Date(formData.checkIn + 'T12:00:00.000Z').toISOString(),
        endDate: new Date(formData.checkOut + 'T23:59:59.000Z').toISOString(),
        rentAmount: formData.totalAmount || 0,
        securityDeposit: 0,
        notes: formData.message || ""
      }

      // Submit booking
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Booking failed with status: ${response.status}`)
      }

      const result = await response.json()

      if (result && (result.id || result.success)) {
        // Show success modal
        setShowSuccessModal(true)

        // Redirect after delay
        setTimeout(() => {
          router.push('/rents')
        }, 3000)
      } else {
        setSubmitError('Failed to create booking - no confirmation received')
      }
    } catch (error: unknown) {
      console.error('Booking submission error:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (errorMessage.includes('401')) {
        setSubmitError('Authentication failed. Please log in again.')
      } else if (errorMessage.includes('403')) {
        setSubmitError('You do not have permission to make bookings.')
      } else if (errorMessage.includes('400')) {
        setSubmitError('Invalid booking data. Please check your information.')
      } else {
        setSubmitError(`Failed to submit booking: ${errorMessage}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoadingProperty) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-4" />
            <div className="text-lg text-slate-600">Loading property details...</div>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  // Error state
  if (submitError && !property) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center px-4">
            <div className="text-lg text-red-600">{submitError}</div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  // Property not found state
  if (!property && !isLoadingProperty) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center px-4">
            <div className="text-lg text-red-600">Property not found</div>
            <button
              onClick={() => router.push('/property')}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Browse Properties
            </button>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  return (
    <ContentWrapper>
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6 sm:mb-8">
          <ButtonCircle icon={<ArrowLeft size={18} />} onClick={handleBack} />
          <h1 className="text-xl sm:text-2xl font-sans font-medium text-slate-900">
            Request to book
          </h1>
        </div>

        {/* Authentication Warning */}
        {!isLoggedIn && (
          <div className="mb-4 sm:mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl">
            <p className="font-medium text-sm sm:text-base">Authentication Required</p>
            <p className="text-xs sm:text-sm">You need to log in to make a booking.</p>
          </div>
        )}

        {/* Main content */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left side - Form */}
          <div className="space-y-6 sm:space-y-8">
            {/* Step 1 - Add payment method */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <span className="text-base sm:text-lg font-semibold text-slate-900">1.</span>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">Add payment method</h2>
                </div>

                {/* Selected Payment Method */}
                <div
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-6 ${getSelectedPaymentOption().bgColor} rounded text-xs font-bold flex items-center justify-center ${getSelectedPaymentOption().textColor}`}>
                      {getSelectedPaymentOption().icon}
                    </div>
                    <span className="text-slate-600 text-sm sm:text-base">{getSelectedPaymentOption().name}</span>
                  </div>
                  <button className="text-teal-600 font-medium text-sm hover:text-teal-700 transition-colors">
                    Change
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleNext}
                    className="px-5 sm:px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors duration-200 text-sm sm:text-base"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 - Booking Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <span className="text-base sm:text-lg font-semibold text-slate-900">2.</span>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">Booking details</h2>
                </div>

                <div className="space-y-4">
                  {/* Start Month Counter */}
                  <div className="space-y-2 sm:space-y-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Start Month
                    </label>
                    <div className="flex items-center justify-between p-3 sm:p-4 border border-slate-200 rounded-lg">
                      <div className="text-left">
                        <div className="font-medium text-slate-900 text-sm sm:text-base">{getStartMonthText()}</div>
                        <div className="text-xs sm:text-sm text-slate-500">Starting month for rental</div>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <button
                          onClick={decrementStartMonth}
                          className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded-full hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={startMonthCount === 0}
                        >
                          <Minus size={14} className="text-slate-600" />
                        </button>
                        <span className="w-6 sm:w-8 text-center font-medium text-slate-900 text-sm sm:text-base">{startMonthCount}</span>
                        <button
                          onClick={incrementStartMonth}
                          className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded-full hover:border-slate-400 transition-colors"
                        >
                          <Plus size={14} className="text-slate-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Duration Counter */}
                  <div className="space-y-2 sm:space-y-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Duration
                    </label>
                    <div className="flex items-center justify-between p-3 sm:p-4 border border-slate-200 rounded-lg">
                      <div className="text-left">
                        <div className="font-medium text-slate-900 text-sm sm:text-base">{getDurationText()}</div>
                        <div className="text-xs sm:text-sm text-slate-500">Rental duration</div>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <button
                          onClick={decrementDuration}
                          className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded-full hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={durationMonths === 1}
                        >
                          <Minus size={14} className="text-slate-600" />
                        </button>
                        <span className="w-6 sm:w-8 text-center font-medium text-slate-900 text-sm sm:text-base">{durationMonths}</span>
                        <button
                          onClick={incrementDuration}
                          className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded-full hover:border-slate-400 transition-colors"
                        >
                          <Plus size={14} className="text-slate-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Show calculated dates */}
                  <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs sm:text-sm font-medium text-slate-700">Calculated Dates:</div>
                    <div className="text-xs sm:text-sm text-slate-600">
                      Check-in: {formData.checkIn ? new Date(formData.checkIn).toLocaleDateString() : 'Not set'}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600">
                      Check-out: {formData.checkOut ? new Date(formData.checkOut).toLocaleDateString() : 'Not set'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={handlePrevious}
                    className="px-4 sm:px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl transition-colors duration-200 text-sm sm:text-base"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-5 sm:px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors duration-200 text-sm sm:text-base"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 - Write a message */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <span className="text-base sm:text-lg font-semibold text-slate-900">3.</span>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">Write a message to the host</h2>
                </div>

                <p className="text-slate-600 text-xs sm:text-sm">
                  Let your host know a little about your visit and why their place is a good fit for you.
                </p>

                <div className="space-y-4">
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell your message in here"
                    className="w-full h-28 sm:h-32 px-4 py-3 border border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm sm:text-base"
                  />

                  <div className="flex justify-between">
                    <button
                      onClick={handlePrevious}
                      className="px-4 sm:px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl transition-colors duration-200 text-sm sm:text-base"
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-5 sm:px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors duration-200 text-sm sm:text-base"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 - Review Request */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <span className="text-base sm:text-lg font-semibold text-slate-900">4.</span>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">Review your request</h2>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-600 mb-1">Payment Method:</p>
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-5 ${getSelectedPaymentOption().bgColor} rounded text-[10px] font-bold flex items-center justify-center ${getSelectedPaymentOption().textColor}`}>
                        {getSelectedPaymentOption().icon}
                      </div>
                      <p className="text-slate-900 font-medium text-sm sm:text-base">{getSelectedPaymentOption().name}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-slate-600 mb-1">Booking Details:</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-900">Check-in: {formData.checkIn ? new Date(formData.checkIn).toLocaleDateString() : 'Not selected'}</p>
                      <p className="text-slate-900">Check-out: {formData.checkOut ? new Date(formData.checkOut).toLocaleDateString() : 'Not selected'}</p>
                      <p className="text-slate-900">Duration: {getDurationText()}</p>
                      <p className="text-slate-900 font-medium">Total: RM {formData.totalAmount}</p>
                    </div>
                  </div>

                  {formData.message && (
                    <div>
                      <p className="text-xs sm:text-sm text-slate-600 mb-1">Message to Host:</p>
                      <p className="text-slate-900 text-sm">{formData.message}</p>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {submitError}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <button
                    onClick={handlePrevious}
                    disabled={isSubmitting}
                    className="px-4 sm:px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 text-sm sm:text-base"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleSubmitBooking}
                    disabled={isSubmitting || !isLoggedIn}
                    className="px-5 sm:px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm sm:text-base"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    <span>{isSubmitting ? 'Submitting...' : !isLoggedIn ? 'Login Required' : 'Submit Booking'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Property Summary */}
          <div className="lg:sticky lg:top-8 lg:self-start order-first lg:order-last">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="space-y-4 sm:space-y-6">
                {/* Property Image */}
                <div className="relative w-full h-40 sm:h-48 rounded-xl overflow-hidden">
                  {property ? (
                    <Image
                      src={
                        property.images && property.images.length > 0
                          ? property.images[0]
                          : "https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758016984/rentverse-rooms/Gemini_Generated_Image_5hdui35hdui35hdu_s34nx6.png"
                      }
                      alt={property.title || `Property ${property.id} image`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 animate-pulse rounded-xl flex items-center justify-center">
                      <span className="text-slate-400 text-sm">Loading image...</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-lg text-xs font-medium text-slate-700">
                    {property?.propertyType?.name || property?.type || 'Loading...'}
                  </div>
                </div>

                {/* Property Details */}
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-xs sm:text-sm text-slate-500 line-clamp-2">
                    {property ? `${property.address}, ${property.city}, ${property.state}, ${property.country}` : 'Loading location...'}
                  </p>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 line-clamp-2">
                    {property?.title || 'Loading property...'}
                  </h3>
                </div>

                {/* Dates */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-slate-700">Dates</span>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-teal-600 font-medium text-xs sm:text-sm hover:text-teal-700 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {formData.checkIn && formData.checkOut
                      ? `${new Date(formData.checkIn).toLocaleDateString()} - ${new Date(formData.checkOut).toLocaleDateString()}`
                      : 'Select dates in the form'
                    }
                  </p>
                </div>

                {/* Price Details */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <h4 className="text-xs sm:text-sm font-medium text-slate-700">Price details</h4>

                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-600">Monthly rent</span>
                    <span className="text-slate-900">RM {getPropertyPrice()}</span>
                  </div>

                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-600">Duration</span>
                    <span className="text-slate-900">{getDurationText()}</span>
                  </div>

                  <div className="flex justify-between text-xs sm:text-sm font-medium border-t border-slate-200 pt-3">
                    <span className="text-slate-900">Total</span>
                    <span className="text-slate-900">RM {formData.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacing for mobile nav */}
        <div className="h-24 md:hidden"></div>
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Select Payment Method</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {paymentOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedPayment(option.id)
                    setShowPaymentModal(false)
                  }}
                  className={`w-full flex items-center justify-between p-4 border rounded-xl transition-colors ${selectedPayment === option.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-8 ${option.bgColor} rounded flex items-center justify-center ${option.textColor} text-xs font-bold`}>
                      {option.icon}
                    </div>
                    <span className="font-medium text-slate-700">{option.name}</span>
                  </div>
                  {selectedPayment === option.id && (
                    <Check size={20} className="text-teal-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading & Success Modal */}
      {(isSubmitting || showSuccessModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center animate-in fade-in zoom-in duration-200">
            {isSubmitting && !showSuccessModal ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-100 flex items-center justify-center">
                  <Loader2 size={32} className="text-teal-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Processing Booking</h3>
                <p className="text-slate-500 text-sm">Please wait while we submit your booking request...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
                  <Check size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Booking Submitted!</h3>
                <p className="text-slate-500 text-sm mb-4">Your booking request has been successfully submitted. Redirecting to your rentals...</p>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full animate-pulse" style={{ width: '100%', animation: 'loading 3s linear' }}></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes loading {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </ContentWrapper>
  )
}

export default BookingPage
