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
    XCircle
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
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            </ContentWrapper>
        )
    }

    if (error || !agreement) {
        return (
            <ContentWrapper>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Error</h2>
                    <p className="text-slate-500 mb-6">{error || 'Agreement not found'}</p>
                    <Link
                        href="/admin/agreements"
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                    >
                        <ChevronLeft className="w-4 h-4 inline mr-1" />
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
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <FileSignature size={28} className="text-indigo-600" />
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Agreement Details</h1>
                            <p className="text-sm text-slate-500">Admin View</p>
                        </div>
                    </div>
                    <Link
                        href="/admin/agreements"
                        className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900"
                    >
                        <ChevronLeft size={16} />
                        <span>Back to Agreements</span>
                    </Link>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-900">Agreement Status</h2>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(agreement.status)}`}>
                                    {getStatusLabel(agreement.status)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-sm text-slate-500 mb-1">Landlord Signature</p>
                                    <div className={`flex items-center gap-2 font-medium ${agreement.landlordSigned ? 'text-green-600' : 'text-amber-600'}`}>
                                        {agreement.landlordSigned ? <CheckCircle size={18} /> : <Clock size={18} />}
                                        {agreement.landlordSigned ? 'Signed' : 'Pending'}
                                    </div>
                                    {agreement.landlordSignedAt && (
                                        <p className="text-xs text-slate-400 mt-1">{formatDateTime(agreement.landlordSignedAt)}</p>
                                    )}
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-sm text-slate-500 mb-1">Tenant Signature</p>
                                    <div className={`flex items-center gap-2 font-medium ${agreement.tenantSigned ? 'text-green-600' : 'text-amber-600'}`}>
                                        {agreement.tenantSigned ? <CheckCircle size={18} /> : <Clock size={18} />}
                                        {agreement.tenantSigned ? 'Signed' : 'Pending'}
                                    </div>
                                    {agreement.tenantSignedAt && (
                                        <p className="text-xs text-slate-400 mt-1">{formatDateTime(agreement.tenantSignedAt)}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-500">Generated</p>
                                    <p className="font-medium text-slate-900">{formatDateTime(agreement.generatedAt)}</p>
                                </div>
                                {agreement.completedAt && (
                                    <div>
                                        <p className="text-slate-500">Completed</p>
                                        <p className="font-medium text-green-600">{formatDateTime(agreement.completedAt)}</p>
                                    </div>
                                )}
                                {agreement.expiresAt && !agreement.completedAt && (
                                    <div>
                                        <p className="text-slate-500">Expires</p>
                                        <p className="font-medium text-amber-600">{formatDateTime(agreement.expiresAt)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Property Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Property Information</h2>
                            <div className="flex gap-4">
                                <div className="w-24 h-24 relative rounded-xl overflow-hidden flex-shrink-0">
                                    <Image
                                        src={agreement.lease.property.images?.[0] || '/placeholder-property.jpg'}
                                        alt={agreement.lease.property.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">{agreement.lease.property.title}</h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                        <MapPin size={14} />
                                        {agreement.lease.property.address}, {agreement.lease.property.city}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2 text-sm text-slate-600">
                                        <Calendar size={14} />
                                        <span>{formatDate(agreement.lease.startDate)} - {formatDate(agreement.lease.endDate)}</span>
                                    </div>
                                    <p className="mt-2 text-lg font-semibold text-indigo-600">
                                        RM {parseFloat(agreement.lease.rentAmount || '0').toLocaleString()}/month
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Parties Info */}
                    <div className="space-y-6">
                        {/* Landlord */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Home size={18} className="text-indigo-600" />
                                <h3 className="font-semibold text-slate-900">Landlord</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <User size={18} className="text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{agreement.lease.landlord.name}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-600 space-y-1">
                                    <p className="flex items-center gap-2">
                                        <Mail size={14} />
                                        {agreement.lease.landlord.email}
                                    </p>
                                    {agreement.lease.landlord.phone && (
                                        <p className="flex items-center gap-2">
                                            <Phone size={14} />
                                            {agreement.lease.landlord.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tenant */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <User size={18} className="text-teal-600" />
                                <h3 className="font-semibold text-slate-900">Tenant</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                        <User size={18} className="text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{agreement.lease.tenant.name}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-600 space-y-1">
                                    <p className="flex items-center gap-2">
                                        <Mail size={14} />
                                        {agreement.lease.tenant.email}
                                    </p>
                                    {agreement.lease.tenant.phone && (
                                        <p className="flex items-center gap-2">
                                            <Phone size={14} />
                                            {agreement.lease.tenant.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h3 className="font-semibold text-slate-900 mb-4">Actions</h3>
                            <div className="space-y-2">
                                {agreement.status === 'COMPLETED' && agreement.pdfUrl && (
                                    <button
                                        onClick={() => window.open(agreement.pdfUrl!, '_blank')}
                                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                                    >
                                        <Download size={16} />
                                        Download PDF
                                    </button>
                                )}
                                {/* Regenerate PDF button - always available for admin */}
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
                                                setToast({ show: true, type: 'success', message: '✅ PDF regenerated successfully!' })
                                                // Update the agreement with new PDF URL
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
                                    className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isRegenerating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                    {isRegenerating ? 'Regenerating...' : 'Regenerate PDF'}
                                </button>
                                {(agreement.status === 'PENDING_LANDLORD' || agreement.status === 'PENDING_TENANT') && (
                                    <button className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center justify-center gap-2">
                                        <Send size={16} />
                                        Send Reminder
                                    </button>
                                )}
                                <Link
                                    href={`/property/${agreement.lease.property.id}`}
                                    className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center justify-center gap-2"
                                >
                                    <Home size={16} />
                                    View Property
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ContentWrapper>
    )
}
