'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ContentWrapper from '@/components/ContentWrapper'
import useAuthStore from '@/stores/authStore'
import {
    ArrowLeft,
    Bell,
    Mail,
    MessageSquare,
    Home,
    CreditCard,
    Tag,
    Calendar,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle
} from 'lucide-react'

interface NotificationSetting {
    id: string
    label: string
    description: string
    icon: React.ComponentType<{ size?: number; className?: string }>
    emailEnabled: boolean
    pushEnabled: boolean
}

function NotificationPreferencesPage() {
    const router = useRouter()
    const { user, isLoggedIn, initializeAuth } = useAuthStore()

    // Notification settings state
    const [settings, setSettings] = useState<NotificationSetting[]>([
        {
            id: 'bookings',
            label: 'Booking Updates',
            description: 'Get notified about new bookings, cancellations, and changes',
            icon: Calendar,
            emailEnabled: true,
            pushEnabled: true,
        },
        {
            id: 'messages',
            label: 'Messages',
            description: 'Receive notifications when someone sends you a message',
            icon: MessageSquare,
            emailEnabled: true,
            pushEnabled: true,
        },
        {
            id: 'property_updates',
            label: 'Property Updates',
            description: 'Updates about your listed properties and their status',
            icon: Home,
            emailEnabled: true,
            pushEnabled: false,
        },
        {
            id: 'payments',
            label: 'Payment Notifications',
            description: 'Transaction confirmations and payment reminders',
            icon: CreditCard,
            emailEnabled: true,
            pushEnabled: true,
        },
        {
            id: 'promotions',
            label: 'Promotions & Offers',
            description: 'Special deals, discounts, and promotional offers',
            icon: Tag,
            emailEnabled: false,
            pushEnabled: false,
        },
        {
            id: 'newsletter',
            label: 'Newsletter',
            description: 'Weekly digest of new properties and market updates',
            icon: Mail,
            emailEnabled: true,
            pushEnabled: false,
        },
    ])

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

    const toggleSetting = (id: string, type: 'email' | 'push') => {
        setSettings(prev => prev.map(setting => {
            if (setting.id === id) {
                return {
                    ...setting,
                    [type === 'email' ? 'emailEnabled' : 'pushEnabled']:
                        type === 'email' ? !setting.emailEnabled : !setting.pushEnabled
                }
            }
            return setting
        }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        setSaveStatus('idle')
        setErrorMessage('')

        try {
            // Simulate API call - replace with actual endpoint when available
            await new Promise(resolve => setTimeout(resolve, 1000))

            // For now, just show success since we're storing locally
            setSaveStatus('success')
            localStorage.setItem('notificationPreferences', JSON.stringify(settings))

            setTimeout(() => setSaveStatus('idle'), 3000)
        } catch (error) {
            console.error('Error saving preferences:', error)
            setSaveStatus('error')
            setErrorMessage('Failed to save notification preferences')
        } finally {
            setIsSaving(false)
        }
    }

    // Load saved preferences on mount
    useEffect(() => {
        const saved = localStorage.getItem('notificationPreferences')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setSettings(prev => prev.map(setting => {
                    const savedSetting = parsed.find((s: NotificationSetting) => s.id === setting.id)
                    if (savedSetting) {
                        return {
                            ...setting,
                            emailEnabled: savedSetting.emailEnabled,
                            pushEnabled: savedSetting.pushEnabled,
                        }
                    }
                    return setting
                }))
            } catch (e) {
                console.error('Error parsing saved preferences:', e)
            }
        }
    }, [])

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
                        <h1 className="text-2xl font-bold text-slate-900">Notification Preferences</h1>
                        <p className="text-slate-500">Choose how you want to be notified</p>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {/* Header Row */}
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                        <span className="font-medium text-slate-900">Notification Type</span>
                        <div className="flex items-center gap-8">
                            <span className="text-sm font-medium text-slate-600 w-16 text-center flex items-center gap-1">
                                <Mail size={14} />
                                Email
                            </span>
                            <span className="text-sm font-medium text-slate-600 w-16 text-center flex items-center gap-1">
                                <Bell size={14} />
                                Push
                            </span>
                        </div>
                    </div>

                    {/* Settings List */}
                    {settings.map((setting, index) => (
                        <div
                            key={setting.id}
                            className={`flex items-center justify-between px-6 py-4 ${index !== settings.length - 1 ? 'border-b border-slate-100' : ''
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                    <setting.icon size={20} />
                                </div>
                                <div>
                                    <h3 className="font-medium text-slate-900">{setting.label}</h3>
                                    <p className="text-sm text-slate-500">{setting.description}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                {/* Email Toggle */}
                                <div className="w-16 flex justify-center">
                                    <button
                                        onClick={() => toggleSetting(setting.id, 'email')}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${setting.emailEnabled ? 'bg-teal-600' : 'bg-slate-300'
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${setting.emailEnabled ? 'left-7' : 'left-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Push Toggle */}
                                <div className="w-16 flex justify-center">
                                    <button
                                        onClick={() => toggleSetting(setting.id, 'push')}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${setting.pushEnabled ? 'bg-teal-600' : 'bg-slate-300'
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${setting.pushEnabled ? 'left-7' : 'left-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Status Messages */}
                {saveStatus === 'success' && (
                    <div className="flex items-center gap-2 p-4 mt-6 bg-green-50 border border-green-200 rounded-xl text-green-700">
                        <CheckCircle size={20} />
                        <span>Notification preferences saved successfully!</span>
                    </div>
                )}

                {saveStatus === 'error' && (
                    <div className="flex items-center gap-2 p-4 mt-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <AlertCircle size={20} />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Save Button */}
                <div className="flex items-center justify-end gap-4 mt-6">
                    <Link
                        href="/account/settings"
                        className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        onClick={handleSave}
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
                                Save Preferences
                            </>
                        )}
                    </button>
                </div>

                {/* Info Box */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="font-medium text-blue-900 mb-1">About Push Notifications</h3>
                    <p className="text-sm text-blue-700">
                        Push notifications require browser permissions. When you enable push notifications,
                        you may be prompted to allow notifications from this website.
                    </p>
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

export default NotificationPreferencesPage
