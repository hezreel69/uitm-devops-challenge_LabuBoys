'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ContentWrapper from '@/components/ContentWrapper'
import useAuthStore from '@/stores/authStore'
import useCurrentUser from '@/hooks/useCurrentUser'
import {
    Search,
    Calendar,
    Heart,
    Home,
    FileSignature,
    User,
    Settings,
    LogOut,
    Shield,
    Lock,
    ArrowLeft,
    ChevronRight
} from 'lucide-react'

function MobileMenuPage() {
    const router = useRouter()
    const { isLoggedIn, logout } = useAuthStore()
    const { user } = useCurrentUser()

    // Redirect to auth if not logged in
    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/auth')
        }
    }, [isLoggedIn, router])

    const handleLogout = () => {
        logout()
        router.push('/')
    }

    if (!isLoggedIn) {
        return null
    }

    const menuSections = [
        {
            title: 'Customer Mode',
            items: [
                { href: '/', icon: Search, label: 'Search Property' },
                { href: '/rents', icon: Calendar, label: 'My Rents' },
                { href: '/wishlist', icon: Heart, label: 'My Wishlists' },
            ]
        },
        {
            title: 'Seller Mode',
            items: [
                { href: '/property/all', icon: Home, label: 'My Listings' },
                { href: '/my-agreements', icon: FileSignature, label: 'My Agreements' },
            ]
        },
        ...(user?.role === 'ADMIN' ? [{
            title: 'Admin Portal',
            items: [
                { href: '/admin', icon: Shield, label: 'Admin Dashboard' },
                { href: '/admin/security', icon: Lock, label: 'Security' },
            ]
        }] : []),
        {
            title: 'Account',
            items: [
                { href: '/account', icon: User, label: 'Account' },
                { href: '/account/settings', icon: Settings, label: 'Settings' },
            ]
        }
    ]

    return (
        <ContentWrapper>
            <div className="px-4 sm:px-6 py-4 sm:py-6">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-5 sm:mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors -ml-2"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <h1 className="text-xl font-semibold text-slate-900">Options</h1>
                </div>

                {/* User Profile Card */}
                {user && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 shadow-sm">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-teal-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold flex-shrink-0">
                                {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm text-slate-500">Welcome,</p>
                                <p className="text-base sm:text-lg font-semibold text-slate-900 truncate">{user.name}</p>
                                <p className="text-xs sm:text-sm text-slate-500 truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Menu Sections */}
                <div className="space-y-3 sm:space-y-4">
                    {menuSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-4 py-2.5 sm:py-3 bg-slate-50 border-b border-slate-100">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {section.title}
                                </p>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {section.items.map((item, itemIndex) => {
                                    const IconComponent = item.icon
                                    return (
                                        <Link
                                            key={itemIndex}
                                            href={item.href}
                                            className="flex items-center justify-between px-4 py-3.5 sm:py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <IconComponent size={20} className="text-slate-400" />
                                                <span className="font-medium text-slate-700 text-sm sm:text-base">{item.label}</span>
                                            </div>
                                            <ChevronRight size={18} className="text-slate-300" />
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Logout Button */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-between w-full px-4 py-3.5 sm:py-4 hover:bg-red-50 active:bg-red-100 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <LogOut size={20} className="text-red-500" />
                                <span className="font-medium text-red-600 text-sm sm:text-base">Log out</span>
                            </div>
                            <ChevronRight size={18} className="text-red-300" />
                        </button>
                    </div>
                </div>

                {/* Bottom spacing for mobile nav */}
                <div className="h-24"></div>
            </div>
        </ContentWrapper>
    )
}

export default MobileMenuPage
