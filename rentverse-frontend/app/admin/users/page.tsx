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
            case 'ADMIN': return 'bg-purple-100 text-purple-700'
            case 'USER': return 'bg-blue-100 text-blue-700'
            default: return 'bg-slate-100 text-slate-700'
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
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
            </ContentWrapper>
        )
    }

    return (
        <ContentWrapper>
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center space-x-3">
                        <Users size={28} className="text-purple-600" />
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Users Management</h1>
                            <p className="text-sm text-slate-500 hidden sm:block">Manage user accounts and permissions</p>
                        </div>
                    </div>
                    <Link
                        href="/admin"
                        className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900"
                    >
                        <span>Back to Dashboard</span>
                        <ChevronRight size={16} />
                    </Link>
                </div>

                {/* Stats Cards */}
                {statistics && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-500">Total Users</p>
                                    <p className="text-xl sm:text-2xl font-bold text-slate-900">{statistics.totalUsers}</p>
                                </div>
                                <Users size={20} className="text-slate-400" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-green-600">Active</p>
                                    <p className="text-xl sm:text-2xl font-bold text-green-700">{statistics.activeUsers}</p>
                                </div>
                                <UserCheck size={20} className="text-green-400" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-purple-600">Admins</p>
                                    <p className="text-xl sm:text-2xl font-bold text-purple-700">{statistics.adminUsers}</p>
                                </div>
                                <ShieldCheck size={20} className="text-purple-400" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-red-600">Locked</p>
                                    <p className="text-xl sm:text-2xl font-bold text-red-700">{statistics.lockedAccounts}</p>
                                </div>
                                <Lock size={20} className="text-red-400" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional Stats Row */}
                {statistics && (
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 text-center">
                            <p className="text-lg sm:text-2xl font-bold text-teal-600">{statistics.landlordCount}</p>
                            <p className="text-xs sm:text-sm text-slate-500">Landlords</p>
                        </div>
                        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 text-center">
                            <p className="text-lg sm:text-2xl font-bold text-blue-600">{statistics.tenantCount}</p>
                            <p className="text-xs sm:text-sm text-slate-500">Tenants</p>
                        </div>
                        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 text-center">
                            <p className="text-lg sm:text-2xl font-bold text-amber-600">{statistics.mfaRate}%</p>
                            <p className="text-xs sm:text-sm text-slate-500">MFA Enabled</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {['all', 'ADMIN', 'USER'].map((role) => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${roleFilter === role
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {role === 'all' ? 'All' : role}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users List */}
                <div className="space-y-3">
                    {users.length === 0 ? (
                        <div className="text-center py-12">
                            <Users size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500">No users found</p>
                        </div>
                    ) : (
                        users.map((user) => (
                            <div
                                key={user.id}
                                className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow ${user.isLocked ? 'border-red-200' : 'border-slate-200'
                                    }`}
                            >
                                <div className="p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-start sm:items-center gap-3">
                                            {/* Avatar */}
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                                                {user.firstName?.[0]}{user.lastName?.[0]}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                                                        {user.name}
                                                    </h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${getRoleColor(user.role)}`}>
                                                        {user.role}
                                                    </span>
                                                    {user.mfaEnabled && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                                                            <Key size={10} /> MFA
                                                        </span>
                                                    )}
                                                    {user.isLocked && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                                                            <Lock size={10} /> Locked
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1">
                                                    <Mail size={12} /> {user.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-13 sm:ml-0">
                                            {user.isLocked && (
                                                <button
                                                    onClick={() => handleUnlock(user.id)}
                                                    disabled={actionInProgress === user.id}
                                                    className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-1"
                                                >
                                                    {actionInProgress === user.id ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : (
                                                        <Unlock size={12} />
                                                    )}
                                                    Unlock
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleToggleStatus(user.id)}
                                                disabled={actionInProgress === user.id}
                                                className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 ${user.isActive
                                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    }`}
                                            >
                                                {actionInProgress === user.id ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : user.isActive ? (
                                                    <><UserX size={12} /> Deactivate</>
                                                ) : (
                                                    <><UserCheck size={12} /> Activate</>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-3 sm:gap-4 text-xs text-slate-500">
                                        {user.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone size={12} /> {user.phone}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} /> Joined {formatDate(user.createdAt)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Key size={12} /> Last login: {formatDate(user.lastLoginAt)}
                                        </span>
                                        {user.propertyCount > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Building2 size={12} /> {user.propertyCount} properties
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
