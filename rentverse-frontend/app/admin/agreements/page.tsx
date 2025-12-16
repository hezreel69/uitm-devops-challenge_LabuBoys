'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import AdminNav from '@/components/AdminNav'
import useAuthStore from '@/stores/authStore'
import {
    FileSignature,
    Clock,
    CheckCircle,
    Send,
    Download,
    Search,
    ChevronRight,
    Loader2,
    Home,
    User,
    Calendar,
    MapPin,
    X,
    XCircle,
    TrendingUp,
    ArrowRight,
    Filter,
    LayoutList
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

export default function AdminAgreementsPage() {
    const router = useRouter()
    const { isLoggedIn, user } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [statistics, setStatistics] = useState<Statistics | null>(null)
    const [agreements, setAgreements] = useState<Agreement[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [sendingReminder, setSendingReminder] = useState<string | null>(null)
    const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' })
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ ...toast, show: false }), 4000)
            return () => clearTimeout(timer)
        }
    }, [toast.show])

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
                } else {
                    setIsRefetching(true)
                }
                const token = localStorage.getItem('authToken')
                const headers = { Authorization: `Bearer ${token}` }

                const [statsRes, agreementsRes] = await Promise.all([
                    fetch(createApiUrl('admin/agreements/statistics'), { headers }),
                    fetch(createApiUrl(`admin/agreements?status=all&search=${debouncedSearch}&limit=50`), { headers }),
                ])

                const statsData = await statsRes.json()
                const agreementsData = await agreementsRes.json()

                if (statsData?.success) {
                    setStatistics(statsData.data.summary)
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
    }, [debouncedSearch])

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
            case 'COMPLETED': return 'bg-emerald-500'
            case 'PENDING_LANDLORD': return 'bg-amber-500'
            case 'PENDING_TENANT': return 'bg-blue-500'
            case 'EXPIRED': return 'bg-red-500'
            case 'CANCELLED': return 'bg-slate-500'
            case 'DRAFT': return 'bg-purple-500'
            default: return 'bg-slate-500'
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    // Kanban columns
    const columns = [
        { id: 'DRAFT', title: 'Draft', color: 'purple' },
        { id: 'PENDING_LANDLORD', title: 'Pending Landlord', color: 'amber' },
        { id: 'PENDING_TENANT', title: 'Pending Tenant', color: 'blue' },
        { id: 'COMPLETED', title: 'Completed', color: 'emerald' },
        { id: 'EXPIRED', title: 'Expired', color: 'red' },
    ]

    const getAgreementsByStatus = (status: string) => {
        return agreements.filter(a => a.status === status)
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
                <AdminNav />

                {/* Stats Overview */}
                {statistics && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-xl">
                            <div className="text-sm text-slate-500 mb-1 font-medium">Total</div>
                            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                {statistics.totalAgreements}
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border-2 border-amber-200 shadow-xl">
                            <div className="text-sm text-amber-700 mb-1 font-semibold">Pending</div>
                            <div className="text-2xl font-bold text-amber-700">{statistics.pendingSignatures}</div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-2xl border-2 border-emerald-200 shadow-xl">
                            <div className="text-sm text-emerald-700 mb-1 font-semibold">Completed</div>
                            <div className="text-2xl font-bold text-emerald-700">{statistics.completed}</div>
                        </div>
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-2xl border-2 border-teal-200 shadow-xl">
                            <div className="text-sm text-teal-700 mb-1 font-semibold">Success %</div>
                            <div className="text-2xl font-bold text-teal-700">{statistics.completionRate}%</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-blue-200 shadow-xl">
                            <div className="text-sm text-blue-700 mb-1 font-semibold">7-Day</div>
                            <div className="text-2xl font-bold text-blue-700">+{statistics.completedLast7d}</div>
                        </div>
                    </div>
                )}

                {/* Search & View Toggle */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                        <input
                            type="text"
                            placeholder="Search by property, landlord, tenant..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 border-2 border-emerald-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 shadow-lg bg-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all shadow-lg ${
                                viewMode === 'kanban'
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <Filter size={18} className="inline mr-2" />
                            Kanban
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all shadow-lg ${
                                viewMode === 'list'
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <LayoutList size={18} className="inline mr-2" />
                            Timeline
                        </button>
                    </div>
                </div>

                {/* Kanban Board */}
                {viewMode === 'kanban' ? (
                    <div className="overflow-x-auto pb-4">
                        <div className="inline-flex gap-4 min-w-full lg:grid lg:grid-cols-5">
                            {columns.map((column) => {
                                const columnAgreements = getAgreementsByStatus(column.id)
                                return (
                                    <div key={column.id} className="flex-shrink-0 w-80 lg:w-auto">
                                        <div className={`bg-gradient-to-br from-${column.color}-50 to-${column.color}-100 rounded-2xl p-4 mb-4 border-2 border-${column.color}-200`}>
                                            <div className="flex items-center justify-between">
                                                <h3 className={`font-bold text-${column.color}-900`}>{column.title}</h3>
                                                <span className={`px-3 py-1 bg-${column.color}-500 text-white rounded-full text-sm font-bold`}>
                                                    {columnAgreements.length}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-3 min-h-[400px]">
                                            {columnAgreements.map((agreement) => (
                                                <div
                                                    key={agreement.id}
                                                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all border-2 border-slate-100 overflow-hidden group hover:scale-105 cursor-pointer"
                                                >
                                                    <div className="relative h-32">
                                                        <Image
                                                            src={agreement.lease.property.images?.[0] || '/placeholder-property.jpg'}
                                                            alt={agreement.lease.property.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                        <div className="absolute bottom-2 left-2 right-2">
                                                            <h4 className="text-white font-bold text-sm line-clamp-1">
                                                                {agreement.lease.property.title}
                                                            </h4>
                                                            <p className="text-white/80 text-xs flex items-center gap-1">
                                                                <MapPin size={10} />
                                                                {agreement.lease.property.city}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        <div className="space-y-2 mb-3 text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <Home size={12} className="text-emerald-600" />
                                                                <span className="text-slate-700 truncate font-medium">{agreement.lease.landlord.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <User size={12} className="text-teal-600" />
                                                                <span className="text-slate-700 truncate font-medium">{agreement.lease.tenant.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Calendar size={12} className="text-cyan-600" />
                                                                <span className="text-slate-600 text-xs">{formatDate(agreement.lease.startDate)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs mb-3">
                                                            <span className={`flex items-center gap-1 ${agreement.landlordSigned ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                {agreement.landlordSigned ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                                L
                                                            </span>
                                                            <ArrowRight size={12} className="text-slate-300" />
                                                            <span className={`flex items-center gap-1 ${agreement.tenantSigned ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                {agreement.tenantSigned ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                                T
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Link
                                                                href={`/admin/agreements/${agreement.leaseId}`}
                                                                className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all text-center"
                                                            >
                                                                View
                                                            </Link>
                                                            {(agreement.status === 'PENDING_LANDLORD' || agreement.status === 'PENDING_TENANT') && (
                                                                <button
                                                                    onClick={() => handleSendReminder(agreement.id)}
                                                                    disabled={sendingReminder === agreement.id}
                                                                    className="px-3 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-all"
                                                                    title="Send Reminder"
                                                                >
                                                                    {sendingReminder === agreement.id ? (
                                                                        <Loader2 size={14} className="animate-spin" />
                                                                    ) : (
                                                                        <Send size={14} />
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {columnAgreements.length === 0 && (
                                                <div className="bg-white/50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200">
                                                    <p className="text-slate-400 text-sm">No items</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    /* Timeline View */
                    <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Agreement Timeline</h3>
                        <div className="space-y-4">
                            {agreements.length === 0 ? (
                                <div className="text-center py-16">
                                    <FileSignature size={64} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 text-lg">No agreements found</p>
                                </div>
                            ) : (
                                agreements.map((agreement, idx) => (
                                    <div key={agreement.id} className="flex items-start gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full ${getStatusColor(agreement.status)} flex items-center justify-center text-white font-bold shadow-lg`}>
                                                {idx + 1}
                                            </div>
                                            {idx < agreements.length - 1 && (
                                                <div className="w-0.5 h-16 bg-slate-200 my-2"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 pb-8">
                                            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 shadow-lg border border-slate-200">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{agreement.lease.property.title}</h4>
                                                        <p className="text-sm text-slate-600">{agreement.lease.property.city}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 ${getStatusColor(agreement.status)} text-white rounded-lg text-xs font-bold`}>
                                                        {agreement.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                                                    <span>Landlord: {agreement.lease.landlord.name}</span>
                                                    <span>Tenant: {agreement.lease.tenant.name}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={`/admin/agreements/${agreement.leaseId}`}
                                                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                                                    >
                                                        View Details
                                                    </Link>
                                                    {agreement.status === 'COMPLETED' && agreement.pdfUrl && (
                                                        <button
                                                            onClick={() => window.open(agreement.pdfUrl!, '_blank')}
                                                            className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-300 transition-all flex items-center gap-2"
                                                        >
                                                            <Download size={16} />
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
                    </div>
                )}

                <div className="h-24 md:hidden"></div>
            </div>
        </ContentWrapper>
    )
}
