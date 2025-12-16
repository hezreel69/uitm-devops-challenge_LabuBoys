'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import useAuthStore from '@/stores/authStore'
import {
    FileSignature,
    Clock,
    CheckCircle,
    AlertTriangle,
    Send,
    Download,
    Search,
    RefreshCw,
    ChevronRight,
    Loader2,
    Home,
    User,
    Calendar,
    MapPin,
    X,
    XCircle
} from 'lucide-react'
import { createApiUrl } from '@/utils/apiConfig'
import Image from 'next/image'

interface Agreement {
    id: string
    leaseId: string
    status: string
    pdfUrl: string | null
    landlordSigned: boolean
    landlordSignedAt: string | null
    tenantSigned: boolean
    tenantSignedAt: string | null
    completedAt: string | null
    generatedAt: string
    lease: {
        id: string
        startDate: string
        endDate: string
        property: {
            id: string
            title: string
            address: string
            city: string
            images: string[]
        }
        landlord: {
            id: string
            name: string
            email: string
        }
        tenant: {
            id: string
            name: string
            email: string
        }
    }
}

interface Statistics {
    totalAgreements: number
    pendingSignatures: number
    pendingLandlord: number
    pendingTenant: number
    completed: number
    expired: number
    cancelled: number
    completedLast7d: number
    completionRate: number
}

interface DailyTrend {
    date: string
    completed: number
    created: number
}

export default function AdminAgreementsPage() {
    const router = useRouter()
    const { isLoggedIn, user } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [statistics, setStatistics] = useState<Statistics | null>(null)
    const [trends, setTrends] = useState<DailyTrend[]>([])
    const [agreements, setAgreements] = useState<Agreement[]>([])
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [sendingReminder, setSendingReminder] = useState<string | null>(null)
    const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' })

    // Auto-hide toast after 4 seconds
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ ...toast, show: false }), 4000)
            return () => clearTimeout(timer)
        }
    }, [toast.show])

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
                    return
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

                const [statsRes, agreementsRes] = await Promise.all([
                    fetch(createApiUrl('admin/agreements/statistics'), { headers }),
                    fetch(createApiUrl(`admin/agreements?status=${statusFilter}&search=${debouncedSearch}&limit=50`), { headers }),
                ])

                const statsData = await statsRes.json()
                const agreementsData = await agreementsRes.json()

                if (statsData?.success) {
                    setStatistics(statsData.data.summary)
                    setTrends(statsData.data.trends?.daily || [])
                }

                if (agreementsData?.success) {
                    setAgreements(agreementsData.data.agreements || [])
                }
            } catch (err) {
                console.error('Failed to fetch data:', err)
                setError('Failed to load agreements data')
            } finally {
                setIsLoading(false)
                setIsRefetching(false)
                isInitialLoad.current = false
            }
        }

        fetchData()
    }, [statusFilter, debouncedSearch])

    const handleSendReminder = async (agreementId: string) => {
        try {
            setSendingReminder(agreementId)
            const token = localStorage.getItem('authToken')

            const response = await fetch(createApiUrl(`admin/agreements/${agreementId}/remind`), {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            const data = await response.json()

            if (data.success) {
                setToast({ show: true, type: 'success', message: `📧 Reminder sent to ${data.data.sentTo}` })
            } else {
                setToast({ show: true, type: 'error', message: data.message || 'Failed to send reminder' })
            }
        } catch (err) {
            console.error('Error sending reminder:', err)
            setToast({ show: true, type: 'error', message: 'Failed to send reminder' })
        } finally {
            setSendingReminder(null)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-700'
            case 'PENDING_LANDLORD': return 'bg-amber-100 text-amber-700'
            case 'PENDING_TENANT': return 'bg-blue-100 text-blue-700'
            case 'EXPIRED': return 'bg-red-100 text-red-700'
            case 'CANCELLED': return 'bg-slate-100 text-slate-700'
            case 'DRAFT': return 'bg-purple-100 text-purple-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'Completed'
            case 'PENDING_LANDLORD': return 'Pending Landlord'
            case 'PENDING_TENANT': return 'Pending Tenant'
            case 'EXPIRED': return 'Expired'
            case 'CANCELLED': return 'Cancelled'
            case 'DRAFT': return 'Draft'
            default: return status
        }
    }

    const formatDate = (dateStr: string) => {
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
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            </ContentWrapper>
        )
    }

    return (
        <ContentWrapper>
            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-4 right-4 z-50 animate-[slideIn_0.3s_ease-out]">
                    <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border backdrop-blur-sm ${toast.type === 'success'
                        ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
                        : 'bg-red-50/95 border-red-200 text-red-800'
                        }`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
                            }`}>
                            {toast.type === 'success' ? (
                                <CheckCircle size={18} className="text-emerald-600" />
                            ) : (
                                <XCircle size={18} className="text-red-600" />
                            )}
                        </div>
                        <span className="font-medium">{toast.message}</span>
                        <button
                            onClick={() => setToast({ ...toast, show: false })}
                            className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center space-x-3">
                        <FileSignature size={28} className="text-indigo-600" />
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Agreements Management</h1>
                            <p className="text-sm text-slate-500 hidden sm:block">Track and manage digital rental agreements</p>
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
                                    <p className="text-xs sm:text-sm text-slate-500">Total</p>
                                    <p className="text-xl sm:text-2xl font-bold text-slate-900">{statistics.totalAgreements}</p>
                                </div>
                                <FileSignature size={20} className="text-slate-400" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-amber-600">Pending</p>
                                    <p className="text-xl sm:text-2xl font-bold text-amber-700">{statistics.pendingSignatures}</p>
                                </div>
                                <Clock size={20} className="text-amber-400" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-green-600">Completed</p>
                                    <p className="text-xl sm:text-2xl font-bold text-green-700">{statistics.completed}</p>
                                </div>
                                <CheckCircle size={20} className="text-green-400" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-500">Rate</p>
                                    <p className="text-xl sm:text-2xl font-bold text-slate-900">{statistics.completionRate}%</p>
                                </div>
                                <AlertTriangle size={20} className="text-slate-400" />
                            </div>
                        </div>
                    </div>
                )}

                {/* 7-Day Trend */}
                {trends.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6 shadow-sm">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">7-Day Agreement Trend</h3>
                        <div className="space-y-2">
                            {trends.map((day) => (
                                <div key={day.date} className="flex items-center gap-2 sm:gap-4">
                                    <span className="w-20 sm:w-24 text-xs sm:text-sm text-slate-600">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="flex-1 flex h-4 sm:h-6 rounded overflow-hidden bg-slate-100">
                                        <div
                                            className="bg-green-500 transition-all"
                                            style={{ width: `${(day.completed / Math.max(day.created, day.completed, 1)) * 100}%` }}
                                        />
                                        <div
                                            className="bg-blue-400 transition-all"
                                            style={{ width: `${(day.created / Math.max(day.created, day.completed, 1)) * 100}%` }}
                                        />
                                    </div>
                                    <span className="w-16 sm:w-20 text-xs sm:text-sm text-slate-600 text-right">
                                        {day.completed}✓ {day.created}+
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4 sm:gap-6 mt-4 text-xs sm:text-sm">
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-green-500 rounded" /> Completed
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-400 rounded" /> Created
                            </span>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by property, landlord, or tenant..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {['all', 'DRAFT', 'PENDING_LANDLORD', 'PENDING_TENANT', 'COMPLETED', 'EXPIRED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${statusFilter === status
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {status === 'all' ? 'All' : getStatusLabel(status)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Agreements List */}
                <div className="space-y-4">
                    {agreements.length === 0 ? (
                        <div className="text-center py-12">
                            <FileSignature size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500">No agreements found</p>
                        </div>
                    ) : (
                        agreements.map((agreement) => (
                            <div
                                key={agreement.id}
                                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col sm:flex-row">
                                    {/* Property Image */}
                                    <div className="sm:w-32 md:w-40 relative">
                                        <div className="h-32 sm:h-full relative">
                                            <Image
                                                src={agreement.lease.property.images?.[0] || '/placeholder-property.jpg'}
                                                alt={agreement.lease.property.title}
                                                fill
                                                className="object-cover"
                                            />
                                            <span className={`absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(agreement.status)}`}>
                                                {getStatusLabel(agreement.status)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                            <div>
                                                <h3 className="font-semibold text-slate-900 text-sm sm:text-base line-clamp-1">
                                                    {agreement.lease.property.title}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1">
                                                    <MapPin size={12} />
                                                    {agreement.lease.property.city}
                                                </p>
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                {formatDate(agreement.generatedAt)}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-3">
                                            <div className="flex items-center gap-1 text-slate-600">
                                                <Home size={12} />
                                                <span className="truncate">{agreement.lease.landlord.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-600">
                                                <User size={12} />
                                                <span className="truncate">{agreement.lease.tenant.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-600 col-span-2">
                                                <Calendar size={12} />
                                                <span>{formatDate(agreement.lease.startDate)} - {formatDate(agreement.lease.endDate)}</span>
                                            </div>
                                        </div>

                                        {/* Signature Status */}
                                        <div className="flex items-center gap-4 text-xs mb-3">
                                            <span className={`flex items-center gap-1 ${agreement.landlordSigned ? 'text-green-600' : 'text-amber-600'}`}>
                                                {agreement.landlordSigned ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                Landlord: {agreement.landlordSigned ? 'Signed' : 'Pending'}
                                            </span>
                                            <span className={`flex items-center gap-1 ${agreement.tenantSigned ? 'text-green-600' : 'text-amber-600'}`}>
                                                {agreement.tenantSigned ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                Tenant: {agreement.tenantSigned ? 'Signed' : 'Pending'}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                href={`/admin/agreements/${agreement.leaseId}`}
                                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
                                            >
                                                View Details
                                            </Link>
                                            {(agreement.status === 'PENDING_LANDLORD' || agreement.status === 'PENDING_TENANT') && (
                                                <button
                                                    onClick={() => handleSendReminder(agreement.id)}
                                                    disabled={sendingReminder === agreement.id}
                                                    className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    {sendingReminder === agreement.id ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : (
                                                        <Send size={12} />
                                                    )}
                                                    Remind
                                                </button>
                                            )}
                                            {agreement.status === 'COMPLETED' && agreement.pdfUrl && (
                                                <button
                                                    onClick={() => window.open(agreement.pdfUrl!, '_blank')}
                                                    className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs rounded-lg hover:bg-slate-300 transition-colors flex items-center gap-1"
                                                >
                                                    <Download size={12} />
                                                    PDF
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Bottom spacing for mobile nav */}
                <div className="h-20 md:hidden"></div>
            </div>
        </ContentWrapper>
    )
}
