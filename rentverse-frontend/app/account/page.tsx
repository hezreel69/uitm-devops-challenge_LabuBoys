'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import useAuthStore from '@/stores/authStore'
import {
  User,
  Settings,
  Heart,
  Home,
  Calendar,
  CreditCard,
  Shield,
  Bell,
  ChevronRight,
  LogOut,
  Mail,
  Phone
} from 'lucide-react'

function AccountPage() {
  const router = useRouter()
  const { user, isLoggedIn, logout, initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/auth/login')
    }
  }, [isLoggedIn, router])

  const handleLogout = () => {
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

  // Get user initials for avatar
  const getInitials = () => {
    const first = user.firstName?.charAt(0) || ''
    const last = user.lastName?.charAt(0) || ''
    return (first + last).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'
  }

  const menuItems = [
    {
      title: 'My Properties',
      description: 'Manage your property listings',
      href: '/property/all',
      icon: Home,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Wishlist',
      description: 'View your saved properties',
      href: '/wishlist',
      icon: Heart,
      color: 'text-red-600 bg-red-100'
    },
    {
      title: 'Bookings',
      description: 'View your rental history',
      href: '/rents',
      icon: Calendar,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: 'Payments',
      description: 'Manage payment methods',
      href: '/account/payments',
      icon: CreditCard,
      color: 'text-green-600 bg-green-100'
    },
  ]

  const settingsItems = [
    {
      title: 'Account Settings',
      description: 'Update your profile and preferences',
      href: '/account/settings',
      icon: Settings,
      color: 'text-slate-600 bg-slate-100'
    },
    {
      title: 'Notifications',
      description: 'Manage email and push notifications',
      href: '/account/notifications',
      icon: Bell,
      color: 'text-amber-600 bg-amber-100'
    },
    {
      title: 'Security',
      description: 'Password and login settings',
      href: '/account/security',
      icon: Shield,
      color: 'text-teal-600 bg-teal-100'
    },
  ]

  return (
    <ContentWrapper>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
              {getInitials()}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">
                {user.name || `${user.firstName} ${user.lastName}`.trim() || 'User'}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-teal-100">
                <span className="flex items-center gap-1">
                  <Mail size={14} />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={14} />
                    {user.phone}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20">
                  {user.role === 'admin' ? 'Admin' : 'Member'}
                </span>
              </div>
            </div>

            {/* Edit Profile Button */}
            <Link
              href="/account/settings"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Settings size={16} />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-teal-300 hover:shadow-md transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Settings Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Settings</h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {settingsItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group ${index !== settingsItems.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <LogOut size={20} />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </ContentWrapper>
  )
}

export default AccountPage