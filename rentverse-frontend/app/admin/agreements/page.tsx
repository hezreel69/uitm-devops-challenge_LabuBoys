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
    XCircle,
    TrendingUp
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
                setToast({ show: true, type: 'success', message: `Reminder sent to ${data.data.sentTo}` })
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
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700'
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
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin animation-delay-150" style={{ animationDirection: 'reverse' }}></div>
                    </div>
                </div>
            </ContentWrapper>
        )
    }

    return (
        <ContentWrapper>
            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-4 right-4 z-50 animate-[slideIn_0.3s_ease-out]">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 backdrop-blur-md ${toast.type === 'success'
                        ? 'bg-gradient-to-r from-emerald-50/95 to-teal-50/95 border-emerald-300 text-emerald-800'
                        : 'bg-gradient-to-r from-red-50/95 to-rose-50/95 border-red-300 text-red-800'
                        }`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${toast.type === 'success' 
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500' 
                            : 'bg-gradient-to-br from-red-400 to-rose-500'
                            }`}>
                            {toast.type === 'success' ? (
                                <CheckCircle size={20} className="text-white" />
                            ) : (
                                <XCircle size={20} className="text-white" />
                            )}
                        </div>
                        <span className="font-semibold text-base">{toast.message}</span>
                        <button
                            onClick={() => setToast({ ...toast, show: false })}
                            className="ml-2 p-1.5 hover:bg-black/10 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl shadow-2xl p-6 sm:p-8 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                                <FileSignature size={32} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                                    Agreements Management
                                </h1>
                                <p className="text-emerald-50 text-sm sm:text-base">Track and manage digital rental agreements</p>
                            </div>
                        </div>
                        <Link
                            href="/admin"
                            className="flex items-center space-x-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
                        >
                            <span className="font-medium">Back to Dashboard</span>
                            <ChevronRight size={18} />
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                {statistics && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
                        <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-slate-100 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Total Agreements</p>
                                    <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{statistics.totalAgreements}</p>
                                </div>
                                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-3 rounded-xl">
                                    <FileSignature size={24} className="text-emerald-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 sm:p-6 rounded-2xl border-2 border-amber-200 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-amber-700 mb-1 font-medium">Pending</p>
                                    <p className="text-3xl sm:text-4xl font-bold text-amber-700">{statistics.pendingSignatures}</p>
                                </div>
                                <div className="bg-amber-200 p-3 rounded-xl">
                                    <Clock size={24} className="text-amber-700" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 sm:p-6 rounded-2xl border-2 border-emerald-200 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-emerald-700 mb-1 font-medium">Completed</p>
                                    <p className="text-3xl sm:text-4xl font-bold text-emerald-700">{statistics.completed}</p>
                                </div>
                                <div className="bg-emerald-200 p-3 rounded-xl">
                                    <CheckCircle size={24} className="text-emerald-700" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-5 sm:p-6 rounded-2xl border-2 border-teal-200 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-teal-700 mb-1 font-medium">Success Rate</p>
                                    <p className="text-3xl sm:text-4xl font-bold text-teal-700">{statistics.completionRate}%</p>
                                </div>
                                <div className="bg-teal-200 p-3 rounded-xl">
                                    <TrendingUp size={24} className="text-teal-700" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7-Day Trend */}
                {trends.length > 0 && (
                    <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 sm:p-8 mb-8 shadow-2xl">
                        <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6">
                            7-Day Agreement Trend
                        </h3>
                        <div className="space-y-3">
                            {trends.map((day) => (
                                <div key={day.date} className="flex items-center gap-3 sm:gap-4">
                                    <span className="w-24 sm:w-32 text-sm font-medium text-slate-700">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="flex-1 flex h-7 sm:h-8 rounded-xl overflow-hidden bg-slate-100 shadow-inner">
                                        <div
                                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
                                            style={{ width: `${(day.completed / Math.max(day.created, day.completed, 1)) * 100}%` }}
                                        />
                                        <div
                                            className="bg-gradient-to-r from-teal-400 to-cyan-500 transition-all"
                                            style={{ width: `${(day.created / Math.max(day.created, day.completed, 1)) * 100}%` }}
                                        />
                                    </div>
                                    <span className="w-20 sm:w-24 text-sm font-semibold text-slate-700 text-right">
                                        {day.completed}✓ {day.created}+
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-6 sm:gap-8 mt-6 text-sm font-medium">
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full shadow" /> Completed
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full shadow" /> Created
                            </span>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                        <input
                            type="text"
                            placeholder="Search by property, landlord, or tenant..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 border-2 border-emerald-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 shadow-lg bg-white"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['all', 'DRAFT', 'PENDING_LANDLORD', 'PENDING_TENANT', 'COMPLETED', 'EXPIRED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 sm:px-5 py-3 text-sm font-semibold rounded-xl whitespace-nowrap transition-all shadow-lg ${statusFilter === status
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl scale-105'
                                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-emerald-300'
                                    }`}
                            >
                                {status === 'all' ? 'All' : getStatusLabel(status)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Agreements List */}
                <div className="space-y-5">
                    {agreements.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl shadow-xl">
                            <FileSignature size={64} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-lg text-slate-500 font-medium">No agreements found</p>
                        </div>
                    ) : (
                        agreements.map((agreement) => (
                            <div
                                key={agreement.id}
                                className="bg-white rounded-3xl border-2 border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]"
                            >
                                <div className="flex flex-col sm:flex-row">
                                    {/* Property Image */}
                                    <div className="sm:w-40 md:w-56 relative">
                                        <div className="h-40 sm:h-full relative">
                                            <Image
                                                src={agreement.lease.property.images?.[0] || '/placeholder-property.jpg'}
                                                alt={agreement.lease.property.title}
                                                fill
                                                className="object-cover"
                                            />
                                            <span className={`absolute top-3 left-3 px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg ${getStatusColor(agreement.status)}`}>
                                                {getStatusLabel(agreement.status)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 p-5 sm:p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-base sm:text-lg line-clamp-1 mb-1">
                                                    {agreement.lease.property.title}
                                                </h3>
                                                <p className="text-sm text-slate-600 flex items-center gap-1.5">
                                                    <MapPin size={14} className="text-emerald-600" />
                                                    {agreement.lease.property.city}
                                                </p>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">
                                                {formatDate(agreement.generatedAt)}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <div className="bg-emerald-100 p-1.5 rounded-lg">
                                                    <Home size={14} className="text-emerald-600" />
                                                </div>
                                                <span className="truncate font-medium">{agreement.lease.landlord.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <div className="bg-teal-100 p-1.5 rounded-lg">
                                                    <User size={14} className="text-teal-600" />
                                                </div>
                                                <span className="truncate font-medium">{agreement.lease.tenant.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-700 col-span-2">
                                                <div className="bg-cyan-100 p-1.5 rounded-lg">
                                                    <Calendar size={14} className="text-cyan-600" />
                                                </div>
                                                <span className="font-medium">{formatDate(agreement.lease.startDate)} - {formatDate(agreement.lease.endDate)}</span>
                                            </div>
                                        </div>

                                        {/* Signature Status */}
                                        <div className="flex items-center gap-5 text-sm mb-4">
                                            <span className={`flex items-center gap-2 font-semibold ${agreement.landlordSigned ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {agreement.landlordSigned ? <CheckCircle size={16} /> : <Clock size={16} />}
                                                Landlord: {agreement.landlordSigned ? 'Signed' : 'Pending'}
                                            </span>
                                            <span className={`flex items-center gap-2 font-semibold ${agreement.tenantSigned ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {agreement.tenantSigned ? <CheckCircle size={16} /> : <Clock size={16} />}
                                                Tenant: {agreement.tenantSigned ? 'Signed' : 'Pending'}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-3">
                                            <Link
                                                href={`/admin/agreements/${agreement.leaseId}`}
                                                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
                                            >
                                                View Details
                                            </Link>
                                            {(agreement.status === 'PENDING_LANDLORD' || agreement.status === 'PENDING_TENANT') && (
                                                <button
                                                    onClick={() => handleSendReminder(agreement.id)}
                                                    disabled={sendingReminder === agreement.id}
                                                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {sendingReminder === agreement.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Send size={16} />
                                                    )}
                                                    Send Reminder
                                                </button>
                                            )}
                                            {agreement.status === 'COMPLETED' && agreement.pdfUrl && (
                                                <button
                                                    onClick={() => window.open(agreement.pdfUrl!, '_blank')}
                                                    className="px-5 py-2.5 bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-300 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                                                >
                                                    <Download size={16} />
                                                    Download PDF
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
                <div className="h-24 md:hidden"></div>
            </div>
        </ContentWrapper>
    )
}
