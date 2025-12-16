'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

interface NotificationBellProps {
  userId?: string
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUnreadCount(data.data.count)
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch('/api/notifications?page=1&limit=10', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNotifications(data.data.notifications)
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Toggle dropdown
  const toggleDropdown = () => {
    const newState = !showDropdown
    setShowDropdown(newState)
    if (newState && notifications.length === 0) {
      fetchNotifications()
    }
  }

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchUnreadCount()

    pollIntervalRef.current = setInterval(() => {
      fetchUnreadCount()
    }, 30000) // Poll every 30 seconds

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  // Notification type icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'RENTAL_APPLICATION':
        return '🏠'
      case 'AGREEMENT_SIGNED_TENANT':
        return '✍️'
      case 'AGREEMENT_SIGNED_LANDLORD':
        return '✅'
      default:
        return '🔔'
    }
  }

  // Time formatting
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2.5 rounded-xl bg-white hover:bg-emerald-50 transition-all shadow-md hover:shadow-lg"
        aria-label="Notifications"
      >
        <Bell size={22} className="text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border-2 border-emerald-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-semibold transition-all"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Bell size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No notifications yet</p>
                <p className="text-slate-400 text-sm mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-emerald-50 transition-colors ${
                      !notification.read ? 'bg-emerald-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 text-sm">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-1.5"></span>
                          )}
                        </div>
                        <p className="text-slate-600 text-sm mb-2">{notification.message}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">{formatTime(notification.createdAt)}</span>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              onClick={() => {
                                markAsRead(notification.id)
                                setShowDropdown(false)
                              }}
                              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                            >
                              View <ExternalLink size={12} />
                            </Link>
                          )}
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-slate-500 hover:text-emerald-600 font-medium flex items-center gap-1"
                            >
                              <Check size={12} /> Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 p-2">
              <Link
                href="/account/notifications"
                onClick={() => setShowDropdown(false)}
                className="block text-center text-sm text-emerald-600 hover:text-emerald-700 font-semibold py-2 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
