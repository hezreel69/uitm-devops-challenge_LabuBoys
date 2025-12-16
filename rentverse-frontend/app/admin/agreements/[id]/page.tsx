'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ContentWrapper from '@/components/ContentWrapper'
import { createApiUrl } from '@/utils/apiConfig'
import useAuthStore from '@/stores/authStore'
import {
    FileSignature,
    ChevronLeft,
    Loader2,
    User,
    Home,
    Calendar,
    MapPin,
    CheckCircle,
    Clock,
    AlertTriangle,
    Download,
    Send,
    Mail,
    Phone,
    RefreshCw,
    X,
    XCircle,
    DollarSign,
    Building
} from 'lucide-react'

interface Agreement {
    id: string
    leaseId: string
    status: string
    generatedAt: string
    expiresAt: string | null
    completedAt: string | null
    pdfUrl: string | null
    landlordSigned: boolean
    landlordSignedAt: string | null
    tenantSigned: boolean
    tenantSignedAt: string | null
    lease: {
        id: string
        startDate: string
        endDate: string
        rentAmount: string
        property: {
            id: string
            title: string
            address: string
            city: string
            state: string
            images: string[]
        }
        landlord: {
            id: string
            name: string
            email: string
            phone: string | null
        }
        tenant: {
            id: string
            name: string
            email: string
            phone: string | null
        }
    }
}

export default function AdminAgreementDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const { isLoggedIn, user } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [agreement, setAgreement] = useState<Agreement | null>(null)
    const [isRegenerating, setIsRegenerating] = useState(false)
    const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' })

    // Auto-hide toast after 4 seconds
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ ...toast, show: false }), 4000)
            return () => clearTimeout(timer)
        }
    }, [toast.show])

    useEffect(() => {
        const checkAccess = async () => {
            const token = localStorage.getItem('authToken')
            if (!isLoggedIn || !token) {
                router.push('/login')
                return
            }
            if (user?.role !== 'ADMIN') {
                router.push('/')
                return
            }
        }
        checkAccess()
    }, [isLoggedIn, user, router])

    useEffect(() => {
        const fetchAgreement = async () => {
            try {
                setIsLoading(true)
                const token = localStorage.getItem('authToken')
                const res = await fetch(createApiUrl(`admin/agreements/${params.id}`), {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()

                if (data.success) {
                    setAgreement(data.data)
                } else {
                    setError(data.message || 'Failed to load agreement')
                }
            } catch (err) {
                console.error('Error fetching agreement:', err)
                setError('Failed to load agreement details')
            } finally {
                setIsLoading(false)
            }
        }

        if (params.id) {
            fetchAgreement()
        }
    }, [params.id])

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

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
    }

    if (isLoading) {
        return (
            <ContentWrapper>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-20 h-20 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin animation-delay-150" style={{ animationDirection: 'reverse' }}></div>
                    </div>
                </div>
            </ContentWrapper>
        )
    }

    if (error || !agreement) {
        return (
            <ContentWrapper>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="bg-gradient-to-br from-red-100 to-rose-100 p-6 rounded-3xl shadow-xl mb-6">
                        <AlertTriangle className="w-16 h-16 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Error</h2>
                    <p className="text-slate-600 mb-8 text-center max-w-md">{error || 'Agreement not found'}</p>
                    <Link
                        href="/admin/agreements"
                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 shadow-xl font-semibold flex items-center gap-2"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Go Back
                    </Link>
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
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl shadow-2xl p-6 sm:p-8 mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                                <FileSignature size={32} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Agreement Details</h1>
                                <p className="text-emerald-50 text-sm">Admin Management View</p>
                            </div>
                        </div>
                        <Link
                            href="/admin/agreements"
                            className="flex items-center space-x-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
                        >
                            <ChevronLeft size={18} />
                            <span className="font-medium hidden sm:inline">Back</span>
                        </Link>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-100 p-6 sm:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                    Agreement Status
                                </h2>
                                <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${getStatusColor(agreement.status)}`}>
                                    {getStatusLabel(agreement.status)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 sm:gap-6">
                                <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 shadow-lg">
                                    <p className="text-sm text-emerald-700 mb-2 font-semibold">Landlord Signature</p>
                                    <div className={`flex items-center gap-2 font-bold text-lg ${agreement.landlordSigned ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {agreement.landlordSigned ? <CheckCircle size={20} /> : <Clock size={20} />}
                                        {agreement.landlordSigned ? 'Signed' : 'Pending'}
                                    </div>
                                    {agreement.landlordSignedAt && (
                                        <p className="text-xs text-slate-500 mt-2 font-medium">{formatDateTime(agreement.landlordSignedAt)}</p>
                                    )}
                                </div>
                                <div className="p-5 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border-2 border-teal-200 shadow-lg">
                                    <p className="text-sm text-teal-700 mb-2 font-semibold">Tenant Signature</p>
                                    <div className={`flex items-center gap-2 font-bold text-lg ${agreement.tenantSigned ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {agreement.tenantSigned ? <CheckCircle size={20} /> : <Clock size={20} />}
                                        {agreement.tenantSigned ? 'Signed' : 'Pending'}
                                    </div>
                                    {agreement.tenantSignedAt && (
                                        <p className="text-xs text-slate-500 mt-2 font-medium">{formatDateTime(agreement.tenantSignedAt)}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t-2 border-slate-100 grid grid-cols-2 gap-4 sm:gap-6 text-sm">
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-slate-500 font-semibold mb-1">Generated</p>
                                    <p className="font-bold text-slate-900">{formatDateTime(agreement.generatedAt)}</p>
                                </div>
                                {agreement.completedAt && (
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                        <p className="text-emerald-700 font-semibold mb-1">Completed</p>
                                        <p className="font-bold text-emerald-600">{formatDateTime(agreement.completedAt)}</p>
                                    </div>
                                )}
                                {agreement.expiresAt && !agreement.completedAt && (
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                        <p className="text-amber-700 font-semibold mb-1">Expires</p>
                                        <p className="font-bold text-amber-600">{formatDateTime(agreement.expiresAt)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Property Info */}
                        <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-100 p-6 sm:p-8">
                            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6">
                                Property Information
                            </h2>
                            <div className="flex gap-5">
                                <div className="w-32 h-32 relative rounded-2xl overflow-hidden flex-shrink-0 shadow-xl border-2 border-slate-100">
                                    <Image
                                        src={agreement.lease.property.images?.[0] || '/placeholder-property.jpg'}
                                        alt={agreement.lease.property.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 text-lg mb-2">{agreement.lease.property.title}</h3>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-600 flex items-center gap-2">
                                            <div className="bg-emerald-100 p-1.5 rounded-lg">
                                                <MapPin size={14} className="text-emerald-600" />
                                            </div>
                                            <span className="font-medium">{agreement.lease.property.address}, {agreement.lease.property.city}</span>
                                        </p>
                                        <p className="text-sm text-slate-600 flex items-center gap-2">
                                            <div className="bg-teal-100 p-1.5 rounded-lg">
                                                <Calendar size={14} className="text-teal-600" />
                                            </div>
                                            <span className="font-medium">{formatDate(agreement.lease.startDate)} - {formatDate(agreement.lease.endDate)}</span>
                                        </p>
                                        <div className="pt-2">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg">
                                                <DollarSign size={20} />
                                                RM {parseFloat(agreement.lease.rentAmount || '0').toLocaleString()}/month
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Parties Info */}
                    <div className="space-y-6">
                        {/* Landlord */}
                        <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-100 p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-lg">
                                    <Home size={20} className="text-white" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg">Landlord</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center shadow-md">
                                        <User size={20} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{agreement.lease.landlord.name}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-700 space-y-3 pl-1">
                                    <p className="flex items-center gap-3">
                                        <div className="bg-emerald-100 p-1.5 rounded-lg">
                                            <Mail size={14} className="text-emerald-600" />
                                        </div>
                                        <span className="font-medium">{agreement.lease.landlord.email}</span>
                                    </p>
                                    {agreement.lease.landlord.phone && (
                                        <p className="flex items-center gap-3">
                                            <div className="bg-teal-100 p-1.5 rounded-lg">
                                                <Phone size={14} className="text-teal-600" />
                                            </div>
                                            <span className="font-medium">{agreement.lease.landlord.phone}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tenant */}
                        <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-100 p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-2.5 rounded-xl shadow-lg">
                                    <User size={20} className="text-white" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg">Tenant</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center shadow-md">
                                        <User size={20} className="text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{agreement.lease.tenant.name}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-700 space-y-3 pl-1">
                                    <p className="flex items-center gap-3">
                                        <div className="bg-teal-100 p-1.5 rounded-lg">
                                            <Mail size={14} className="text-teal-600" />
                                        </div>
                                        <span className="font-medium">{agreement.lease.tenant.email}</span>
                                    </p>
                                    {agreement.lease.tenant.phone && (
                                        <p className="flex items-center gap-3">
                                            <div className="bg-cyan-100 p-1.5 rounded-lg">
                                                <Phone size={14} className="text-cyan-600" />
                                            </div>
                                            <span className="font-medium">{agreement.lease.tenant.phone}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-100 p-6">
                            <h3 className="font-bold text-slate-900 text-lg mb-5">Quick Actions</h3>
                            <div className="space-y-3">
                                {agreement.status === 'COMPLETED' && agreement.pdfUrl && (
                                    <button
                                        onClick={() => window.open(agreement.pdfUrl!, '_blank')}
                                        className="w-full px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 flex items-center justify-center gap-2 font-bold shadow-xl hover:shadow-2xl transition-all"
                                    >
                                        <Download size={18} />
                                        Download PDF
                                    </button>
                                )}
                                <button
                                    onClick={async () => {
                                        try {
                                            setIsRegenerating(true)
                                            const token = localStorage.getItem('authToken')
                                            const res = await fetch(createApiUrl(`admin/agreements/${params.id}/regenerate-pdf`), {
                                                method: 'POST',
                                                headers: { Authorization: `Bearer ${token}` }
                                            })
                                            const data = await res.json()
                                            if (data.success) {
                                                setToast({ show: true, type: 'success', message: 'PDF regenerated successfully!' })
                                                setAgreement(prev => prev ? { ...prev, pdfUrl: data.data.pdfUrl } : null)
                                            } else {
                                                setToast({ show: true, type: 'error', message: data.message || 'Failed to regenerate PDF' })
                                            }
                                        } catch (err) {
                                            setToast({ show: true, type: 'error', message: 'Failed to regenerate PDF' })
                                        } finally {
                                            setIsRegenerating(false)
                                        }
                                    }}
                                    disabled={isRegenerating}
                                    className="w-full px-5 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 flex items-center justify-center gap-2 font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
                                >
                                    {isRegenerating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                    {isRegenerating ? 'Regenerating...' : 'Regenerate PDF'}
                                </button>
                                {(agreement.status === 'PENDING_LANDLORD' || agreement.status === 'PENDING_TENANT') && (
                                    <button className="w-full px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 flex items-center justify-center gap-2 font-bold shadow-xl hover:shadow-2xl transition-all">
                                        <Send size={18} />
                                        Send Reminder
                                    </button>
                                )}
                                <Link
                                    href={`/property/${agreement.lease.property.id}`}
                                    className="w-full px-5 py-3.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 flex items-center justify-center gap-2 font-bold shadow-lg hover:shadow-xl transition-all"
                                >
                                    <Building size={18} />
                                    View Property
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom spacing for mobile nav */}
                <div className="h-24 md:hidden"></div>
            </div>
        </ContentWrapper>
    )
}
