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
    Building2,
    TrendingUp,
    TrendingDown,
    Activity,
    BarChart3
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
    const [statistics, setStatistics] = useState<Statistics | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [roleFilter, setRoleFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [actionInProgress, setActionInProgress] = useState<string | null>(null)

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

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const isInitialLoad = useRef(true)
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (isInitialLoad.current) {
                    setIsLoading(true)
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
            case 'ADMIN': return 'bg-purple-500'
            case 'USER': return 'bg-blue-500'
            default: return 'bg-slate-500'
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
                                User Analytics Hub
                            </h1>
                            <p className="text-sm sm:text-base text-slate-600 mt-1">Segmentation & lifecycle insights</p>
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

                {/* User Segment Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Landlords Segment */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-2xl p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <Building2 size={28} className="opacity-90" />
                                <TrendingUp size={20} />
                            </div>
                            <div className="mb-4">
                                <div className="text-4xl font-bold mb-1">{statistics.landlordCount}</div>
                                <div className="text-sm opacity-90 font-medium">Landlords</div>
                            </div>
                            <div className="text-xs opacity-75 mt-2">Property owners with listings</div>
                        </div>

                        {/* Tenants Segment */}
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <Users size={28} className="opacity-90" />
                                <TrendingUp size={20} />
                            </div>
                            <div className="mb-4">
                                <div className="text-4xl font-bold mb-1">{statistics.tenantCount}</div>
                                <div className="text-sm opacity-90 font-medium">Tenants</div>
                            </div>
                            <div className="text-xs opacity-75 mt-2">Active and seeking users</div>
                        </div>

                        {/* Admins Segment */}
                        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl shadow-2xl p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <ShieldCheck size={28} className="opacity-90" />
                                <Activity size={20} />
                            </div>
                            <div className="mb-4">
                                <div className="text-4xl font-bold mb-1">{statistics.adminUsers}</div>
                                <div className="text-sm opacity-90 font-medium">Admins</div>
                            </div>
                            <div className="text-xs opacity-75 mt-2">Platform administrators</div>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="bg-white rounded-2xl shadow-lg p-4 border-2 border-emerald-100 mb-6">
                    <div className="relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-emerald-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        />
                    </div>
                </div>

                {/* Role Filter Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {['all', 'ADMIN', 'USER'].map((role) => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`px-6 py-3 text-sm font-semibold rounded-xl whitespace-nowrap transition-all shadow-md ${
                                roleFilter === role
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg scale-105'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 hover:shadow-lg'
                            }`}
                        >
                            {role === 'all' ? 'All Users' : role}
                        </button>
                    ))}
                </div>

                {/* User Directory - Categorized by Role */}
                <div className="space-y-6">
                    {users.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl shadow-xl">
                            <Users size={64} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 text-lg">No users found</p>
                        </div>
                    ) : (
                        users.map((user) => {
                            return (
                                <div
                                    key={user.id}
                                    className={`bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all shadow-xl ${
                                        user.isLocked ? 'border-2 border-red-300' : 'border border-slate-100'
                                    }`}
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                {/* Avatar with Role Color */}
                                                <div className={`w-16 h-16 rounded-2xl ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                                        <h3 className="font-bold text-slate-900 text-lg">
                                                            {user.name}
                                                        </h3>
                                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white ${getRoleColor(user.role)}`}>
                                                            {user.role}
                                                        </span>
                                                        {user.mfaEnabled && (
                                                            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                                                <Key size={12} /> MFA
                                                            </span>
                                                        )}
                                                        {user.isLocked && (
                                                            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                                                                <Lock size={12} /> Locked
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600 flex items-center gap-2 mb-1">
                                                        <Mail size={14} className="text-emerald-500" /> {user.email}
                                                    </p>
                                                    {user.phone && (
                                                        <p className="text-sm text-slate-600 flex items-center gap-2">
                                                            <Phone size={14} className="text-teal-500" /> {user.phone}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                            {/* User Metrics */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                                                <div className="text-xs text-emerald-600 mb-1 font-semibold">Properties</div>
                                                <div className="text-xl font-bold text-emerald-700">{user.propertyCount || 0}</div>
                                            </div>
                                            <div className="bg-teal-50 rounded-xl p-3 border border-teal-200">
                                                <div className="text-xs text-teal-600 mb-1 font-semibold">Leases</div>
                                                <div className="text-xl font-bold text-teal-700">{user.leaseCount || 0}</div>
                                            </div>
                                            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                                                <div className="text-xs text-blue-600 mb-1 font-semibold">Joined</div>
                                                <div className="text-xs font-bold text-blue-700">{formatDate(user.createdAt)}</div>
                                            </div>
                                            <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
                                                <div className="text-xs text-purple-600 mb-1 font-semibold">Last Login</div>
                                                <div className="text-xs font-bold text-purple-700">{formatDate(user.lastLoginAt)}</div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                                            {user.isLocked && (
                                                <button
                                                    onClick={() => handleUnlock(user.id)}
                                                    disabled={actionInProgress === user.id}
                                                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2 shadow-md"
                                                >
                                                    {actionInProgress === user.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Unlock size={16} />
                                                    )}
                                                    Unlock Account
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleToggleStatus(user.id)}
                                                disabled={actionInProgress === user.id}
                                                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg ${
                                                    user.isActive
                                                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                                                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                                                }`}
                                            >
                                                {actionInProgress === user.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : user.isActive ? (
                                                    <><UserX size={16} /> Deactivate</>
                                                ) : (
                                                    <><UserCheck size={16} /> Activate</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="h-20 md:hidden"></div>
            </div>
        </ContentWrapper>
    )
}
