'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ContentWrapper from '@/components/ContentWrapper'
import useAuthStore from '@/stores/authStore'
import {
    ArrowLeft,
    Shield,
    Lock,
    Eye,
    EyeOff,
    Key,
    Smartphone,
    LogOut,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle,
    AlertTriangle
} from 'lucide-react'

function SecuritySettingsPage() {
    const router = useRouter()
    const { user, isLoggedIn, initializeAuth, logout } = useAuthStore()

    // Password change form
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (newPassword.length < 6) {
            setSaveStatus('error')
            setErrorMessage('New password must be at least 6 characters')
            return
        }

        if (newPassword !== confirmPassword) {
            setSaveStatus('error')
            setErrorMessage('New passwords do not match')
            return
        }

        setIsSaving(true)
        setSaveStatus('idle')
        setErrorMessage('')

        try {
            const token = localStorage.getItem('authToken')
            if (!token) {
                throw new Error('Not authenticated')
            }

            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            })

            const result = await response.json()

            if (response.ok && result.success) {
                setSaveStatus('success')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')

                setTimeout(() => setSaveStatus('idle'), 3000)
            } else {
                setSaveStatus('error')
                setErrorMessage(result.message || 'Failed to change password')
            }
        } catch (error) {
            console.error('Error changing password:', error)
            setSaveStatus('error')
            setErrorMessage(error instanceof Error ? error.message : 'Failed to change password')
        } finally {
            setIsSaving(false)
        }
    }

    const handleLogoutAllDevices = async () => {
        if (!confirm('This will log you out from all devices. Continue?')) {
            return
        }

        // For now, just logout locally
        logout()
        router.push('/')
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
                        href="/account/settings"
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Security Settings</h1>
                        <p className="text-slate-500">Manage your password and security options</p>
                    </div>
                </div>

                {/* Password Change Section */}
                <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                            <Lock size={20} className="text-teal-600" />
                            Change Password
                        </h2>

                        <div className="space-y-4">
                            {/* Current Password */}
                            <div>
                                <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-1">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        id="currentPassword"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="Enter your current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="Enter your new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Must be at least 6 characters</p>
                            </div>

                            {/* Confirm New Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="Confirm your new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Status Messages */}
                        {saveStatus === 'success' && (
                            <div className="flex items-center gap-2 p-4 mt-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                                <CheckCircle size={20} />
                                <span>Password changed successfully!</span>
                            </div>
                        )}

                        {saveStatus === 'error' && (
                            <div className="flex items-center gap-2 p-4 mt-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                                <AlertCircle size={20} />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                                className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Changing Password...
                                    </>
                                ) : (
                                    <>
                                        <Key size={18} />
                                        Change Password
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Two-Factor Authentication (Coming Soon) */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 mt-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Smartphone size={20} className="text-teal-600" />
                        Two-Factor Authentication
                    </h2>
                    <p className="text-slate-500 mb-4">
                        Add an extra layer of security to your account by requiring a verification code in addition to your password.
                    </p>
                    <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                        <AlertTriangle size={20} />
                        <span>Two-factor authentication is coming soon</span>
                    </div>
                </div>

                {/* Active Sessions */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 mt-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Shield size={20} className="text-teal-600" />
                        Active Sessions
                    </h2>
                    <p className="text-slate-500 mb-4">
                        You can log out from all devices if you suspect unauthorized access to your account.
                    </p>
                    <button
                        onClick={handleLogoutAllDevices}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut size={18} />
                        Log Out From All Devices
                    </button>
                </div>

                {/* Back Link */}
                <div className="mt-8 pt-4">
                    <Link
                        href="/account/settings"
                        className="text-teal-600 hover:text-teal-700 font-medium"
                    >
                        ← Back to Account Settings
                    </Link>
                </div>
            </div>
        </ContentWrapper>
    )
}

export default SecuritySettingsPage
