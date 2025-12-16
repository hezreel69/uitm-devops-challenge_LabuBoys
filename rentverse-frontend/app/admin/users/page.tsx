'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import {
    Users,
    ShieldCheck,
    UserX,
    UserCheck,
    Search,
    ChevronRight,
    Loader2,
    Mail,
    Phone,
    Calendar,
    Key,
    Lock,
    Unlock,
    Building2
} from 'lucide-react'
import { createApiUrl } from '@/utils/apiConfig'

interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    name: string
    phone: string
    role: string
    isActive: boolean
    mfaEnabled: boolean
    lastLoginAt: string | null
    createdAt: string
    lockedUntil: string | null
    isLocked: boolean
    propertyCount: number
    leaseCount: number
}

interface Statistics {
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    adminUsers: number
    landlordCount: number
    tenantCount: number
    newUsersLast7d: number
    lockedAccounts: number
    mfaEnabled: number
    mfaRate: number
}

export default function AdminUsersPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [statistics, setStatistics] = useState<Statistics | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [roleFilter, setRoleFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [actionInProgress, setActionInProgress] = useState<string | null>(null)

    // Check admin access
    useEffect(() => {
        const checkAccess = async () => {
            const token = localStorage.getItem('authToken')
            if (!token) {
                router.push('/auth')
                return
            }

            try {
                const response = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await response.json()

                if (!data.success || data.data.user.role !== 'ADMIN') {
                    router.push('/')
                }
            } catch {
                router.push('/auth')
            }
        }

        checkAccess()
    }, [router])

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Fetch data
    const isInitialLoad = useRef(true)
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (isInitialLoad.current) {
                    setIsLoading(true)
                } else {
                    setIsRefetching(true)
                }
                const token = localStorage.getItem('authToken')
                const headers = { Authorization: `Bearer ${token}` }

                const [statsRes, usersRes] = await Promise.all([
                    fetch(createApiUrl('admin/users/statistics'), { headers }),
                    fetch(createApiUrl(`admin/users?role=${roleFilter}&search=${debouncedSearch}&limit=50`), { headers }),
                ])

                const statsData = await statsRes.json()
                const usersData = await usersRes.json()

                if (statsData?.success) {
                    setStatistics(statsData.data.summary)
                }

                if (usersData?.success) {
                    setUsers(usersData.data.users || [])
                }
            } catch (err) {
                console.error('Failed to fetch data:', err)
            } finally {
                setIsLoading(false)
                setIsRefetching(false)
                isInitialLoad.current = false
            }
        }

        fetchData()
    }, [roleFilter, debouncedSearch])

    const handleToggleStatus = async (userId: string) => {
        try {
            setActionInProgress(userId)
            const token = localStorage.getItem('authToken')

            const response = await fetch(createApiUrl(`admin/users/${userId}/toggle-status`), {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            })

            const data = await response.json()

            if (data.success) {
                setUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, isActive: data.data.isActive } : u
                ))
            } else {
                alert(data.message || 'Failed to update user status')
            }
        } catch (err) {
            console.error('Error toggling status:', err)
        } finally {
            setActionInProgress(null)
        }
    }

    const handleUnlock = async (userId: string) => {
        try {
            setActionInProgress(userId)
            const token = localStorage.getItem('authToken')

            const response = await fetch(createApiUrl(`admin/users/${userId}/unlock`), {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            })

            const data = await response.json()

            if (data.success) {
                setUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, isLocked: false, lockedUntil: null } : u
                ))
            }
        } catch (err) {
            console.error('Error unlocking user:', err)
        } finally {
            setActionInProgress(null)
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-purple-100 text-purple-700 border border-purple-200'
            case 'USER': return 'bg-blue-100 text-blue-700 border border-blue-200'
            default: return 'bg-slate-100 text-slate-700 border border-slate-200'
        }
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never'
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    if (isLoading) {
        return (
            <ContentWrapper>
                <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                        <div className="absolute inset-0">
                            <Loader2 className="w-12 h-12 text-teal-400 animate-spin" style={{ animationDirection: 'reverse' }} />
                        </div>
                    </div>
                </div>
            </ContentWrapper>
        )
    }

    return (
        <ContentWrapper>
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl">
                            <Users size={32} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                Users Management
                            </h1>
                            <p className="text-sm sm:text-base text-slate-600 mt-1">Manage user accounts and permissions</p>
                        </div>
                    </div>
                    <Link
                        href="/admin"
                        className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all text-sm text-slate-700 hover:text-emerald-600"
                    >
                        <span>Back to Dashboard</span>
                        <ChevronRight size={18} />
                    </Link>
                </div>

                {/* Stats Cards */}
                {statistics && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
                        <div className="bg-gradient-to-br from-white to-slate-50 p-5 sm:p-6 rounded-2xl shadow-xl border border-slate-200 hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-500 font-medium mb-1">Total Users</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">{statistics.totalUsers}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
                                    <Users size={24} className="text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 sm:p-6 rounded-2xl shadow-xl border border-emerald-200 hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-emerald-600 font-medium mb-1">Active</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{statistics.activeUsers}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                    <UserCheck size={24} className="text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-5 sm:p-6 rounded-2xl shadow-xl border border-purple-200 hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-purple-600 font-medium mb-1">Admins</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-purple-700">{statistics.adminUsers}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                                    <ShieldCheck size={24} className="text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-rose-50 p-5 sm:p-6 rounded-2xl shadow-xl border border-red-200 hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-red-600 font-medium mb-1">Locked</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-red-700">{statistics.lockedAccounts}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                                    <Lock size={24} className="text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional Stats Row */}
                {statistics && (
                    <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-8">
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 sm:p-5 rounded-2xl shadow-xl border border-teal-200 text-center hover:scale-105 transition-transform">
                            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                {statistics.landlordCount}
                            </p>
                            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">Landlords</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-5 rounded-2xl shadow-xl border border-blue-200 text-center hover:scale-105 transition-transform">
                            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {statistics.tenantCount}
                            </p>
                            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">Tenants</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-5 rounded-2xl shadow-xl border border-amber-200 text-center hover:scale-105 transition-transform">
                            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                {statistics.mfaRate}%
                            </p>
                            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">MFA Enabled</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['all', 'ADMIN', 'USER'].map((role) => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all shadow-md ${
                                    roleFilter === role
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg scale-105'
                                        : 'bg-white text-slate-600 hover:bg-slate-50 hover:shadow-lg'
                                }`}
                            >
                                {role === 'all' ? 'All' : role}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users List */}
                <div className="space-y-4">
                    {users.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl shadow-xl">
                            <Users size={64} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 text-lg">No users found</p>
                        </div>
                    ) : (
                        users.map((user) => (
                            <div
                                key={user.id}
                                className={`bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all shadow-xl hover:scale-[1.01] ${
                                    user.isLocked ? 'border-2 border-red-300' : 'border border-slate-100'
                                }`}
                            >
                                <div className="p-5 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex items-start sm:items-center gap-4">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
                                                {user.firstName?.[0]}{user.lastName?.[0]}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                                                        {user.name}
                                                    </h3>
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getRoleColor(user.role)}`}>
                                                        {user.role}
                                                    </span>
                                                    {user.mfaEnabled && (
                                                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                                            <Key size={12} /> MFA
                                                        </span>
                                                    )}
                                                    {user.isLocked && (
                                                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                                                            <Lock size={12} /> Locked
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
                                                    <Mail size={13} className="text-emerald-500" /> {user.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-16 sm:ml-0">
                                            {user.isLocked && (
                                                <button
                                                    onClick={() => handleUnlock(user.id)}
                                                    disabled={actionInProgress === user.id}
                                                    className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-1.5 shadow-md"
                                                >
                                                    {actionInProgress === user.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Unlock size={14} />
                                                    )}
                                                    Unlock
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleToggleStatus(user.id)}
                                                disabled={actionInProgress === user.id}
                                                className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg ${
                                                    user.isActive
                                                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                                                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                                                }`}
                                            >
                                                {actionInProgress === user.id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : user.isActive ? (
                                                    <><UserX size={14} /> Deactivate</>
                                                ) : (
                                                    <><UserCheck size={14} /> Activate</>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-600">
                                        {user.phone && (
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <Phone size={13} className="text-teal-500" /> {user.phone}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <Calendar size={13} className="text-teal-500" /> Joined {formatDate(user.createdAt)}
                                        </span>
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <Key size={13} className="text-teal-500" /> Last login: {formatDate(user.lastLoginAt)}
                                        </span>
                                        {user.propertyCount > 0 && (
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <Building2 size={13} className="text-teal-500" /> {user.propertyCount} properties
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Bottom spacing */}
                <div className="h-20 md:hidden"></div>
            </div>
        </ContentWrapper>
    )
}
