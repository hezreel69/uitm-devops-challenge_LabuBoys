'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ContentWrapper from '@/components/ContentWrapper'
import useAuthStore from '@/stores/authStore'
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Calendar,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle
} from 'lucide-react'

function AccountSettingsPage() {
    const router = useRouter()
    const { user, isLoggedIn, initializeAuth, refreshUserData } = useAuthStore()

    // Form state
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [dateOfBirth, setDateOfBirth] = useState('')

    // UI state
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        initializeAuth()
    }, [initializeAuth])

    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/auth/login')
        }
    }, [isLoggedIn, router])

    // Helper function to format date to yyyy-MM-dd
    const formatDateForInput = (dateString: string | undefined): string => {
        if (!dateString) return ''
        try {
            // Handle ISO date strings like "2003-01-09T00:00:00.000Z"
            const date = new Date(dateString)
            if (isNaN(date.getTime())) return ''
            return date.toISOString().split('T')[0]
        } catch {
            return ''
        }
    }

    // Populate form with user data
    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '')
            setLastName(user.lastName || '')
            setPhone(user.phone || '')
            setDateOfBirth(formatDateForInput(user.dateOfBirth || user.birthdate))
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) return

        setIsSaving(true)
        setSaveStatus('idle')
        setErrorMessage('')

        try {
            const token = localStorage.getItem('authToken')
            if (!token) {
                throw new Error('Not authenticated')
            }

            const response = await fetch('/api/users/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    phone,
                    dateOfBirth,
                }),
            })

            const result = await response.json()

            if (response.ok && result.success) {
                setSaveStatus('success')
                // Refresh user data from backend
                await refreshUserData()

                // Reset success status after 3 seconds
                setTimeout(() => setSaveStatus('idle'), 3000)
            } else {
                setSaveStatus('error')
                setErrorMessage(result.message || 'Failed to update profile')
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            setSaveStatus('error')
            setErrorMessage(error instanceof Error ? error.message : 'Failed to update profile')
        } finally {
            setIsSaving(false)
        }
    }

    if (!isLoggedIn || !user) {
        return (
            <ContentWrapper>
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    </div>
                </div>
            </ContentWrapper>
        )
    }

    return (
        <ContentWrapper>
            <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/account"
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
                        <p className="text-slate-500">Update your personal information</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Section */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                            <User size={20} className="text-teal-600" />
                            Personal Information
                        </h2>

                        <div className="space-y-4">
                            {/* Name Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="Enter your first name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="Enter your last name"
                                    />
                                </div>
                            </div>

                            {/* Email (Read-only) */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                                    <span className="flex items-center gap-1">
                                        <Mail size={14} />
                                        Email Address
                                    </span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={user.email}
                                    disabled
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                            </div>

                            {/* Phone */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                                    <span className="flex items-center gap-1">
                                        <Phone size={14} />
                                        Phone Number
                                    </span>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                    placeholder="+60 12 345 6789"
                                />
                            </div>

                            {/* Date of Birth */}
                            <div>
                                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700 mb-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        Date of Birth
                                    </span>
                                </label>
                                <input
                                    type="date"
                                    id="dateOfBirth"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status Messages */}
                    {saveStatus === 'success' && (
                        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                            <CheckCircle size={20} />
                            <span>Your profile has been updated successfully!</span>
                        </div>
                    )}

                    {saveStatus === 'error' && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                            <AlertCircle size={20} />
                            <span>{errorMessage || 'Failed to update profile. Please try again.'}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href="/account"
                            className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Additional Settings Links */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wide">More Settings</h3>
                    <div className="space-y-2">
                        <Link
                            href="/account/security"
                            className="block p-4 bg-white border border-slate-200 rounded-xl hover:border-teal-300 transition-colors"
                        >
                            <span className="font-medium text-slate-900">Security Settings</span>
                            <p className="text-sm text-slate-500">Change password and manage login options</p>
                        </Link>
                        <Link
                            href="/account/notifications"
                            className="block p-4 bg-white border border-slate-200 rounded-xl hover:border-teal-300 transition-colors"
                        >
                            <span className="font-medium text-slate-900">Notification Preferences</span>
                            <p className="text-sm text-slate-500">Manage email and push notification settings</p>
                        </Link>
                    </div>
                </div>
            </div>
        </ContentWrapper>
    )
}

export default AccountSettingsPage
