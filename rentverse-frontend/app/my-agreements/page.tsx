'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import ContentWrapper from '@/components/ContentWrapper'
import { FileSignature, Calendar, User, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Home, Key } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import useCurrentUser from '@/hooks/useCurrentUser'
import { createApiUrl } from '@/utils/apiConfig'

interface Agreement {
    id: string
    leaseId: string
    pdfUrl: string | null
    status: string
    landlordSigned: boolean
    landlordSignedAt: string | null
    tenantSigned: boolean
    tenantSignedAt: string | null
    completedAt: string | null
    expiresAt: string | null
    generatedAt: string
    lease: {
        id: string
        startDate: string
        endDate: string
        rentAmount: string
        currencyCode: string
        property: {
            id: string
            title: string
            address: string
            city: string
            images: string[]
        }
        tenant: {
            id: string
            name: string
            email: string
        }
        landlord: {
            id: string
            name: string
            email: string
        }
    }
}

type RoleFilter = 'all' | 'landlord' | 'tenant'

function MyAgreementsPage() {
    const [agreements, setAgreements] = useState<Agreement[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
    const { isLoggedIn } = useAuthStore()
    const { user } = useCurrentUser()

    useEffect(() => {
        const fetchAgreements = async () => {
            if (!isLoggedIn) {
                setIsLoading(false)
                return
            }

            try {
                const token = localStorage.getItem('authToken')
                if (!token) {
                    setError('Authentication token not found')
                    setIsLoading(false)
                    return
                }

                const response = await fetch(createApiUrl('agreements/my-agreements'), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                })

                if (!response.ok) {
                    if (response.status === 404) {
                        setAgreements([])
                        setIsLoading(false)
                        return
                    }
                    throw new Error(`Failed to fetch agreements: ${response.status}`)
                }

                const data = await response.json()

                if (data.success) {
                    setAgreements(data.data)
                } else {
                    setError('Failed to load agreements')
                }
            } catch (err) {
                console.error('Error fetching agreements:', err)
                setError(err instanceof Error ? err.message : 'Failed to load agreements')
            } finally {
                setIsLoading(false)
            }
        }

        fetchAgreements()
    }, [isLoggedIn])

    // Determine user's role for each agreement
    const getUserRole = (agreement: Agreement): 'landlord' | 'tenant' => {
        return agreement.lease.landlord.id === user?.id ? 'landlord' : 'tenant'
    }

    // Filter agreements based on role
    const filteredAgreements = agreements.filter(agreement => {
        if (roleFilter === 'all') return true
        return getUserRole(agreement) === roleFilter
    })

    // Count by role
    const landlordCount = agreements.filter(a => getUserRole(a) === 'landlord').length
    const tenantCount = agreements.filter(a => getUserRole(a) === 'tenant').length

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'DRAFT':
                return 'bg-gray-100 text-gray-800'
            case 'PENDING_LANDLORD':
                return 'bg-yellow-100 text-yellow-800'
            case 'PENDING_TENANT':
                return 'bg-blue-100 text-blue-800'
            case 'COMPLETED':
                return 'bg-green-100 text-green-800'
            case 'EXPIRED':
                return 'bg-red-100 text-red-800'
            case 'CANCELLED':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status.toUpperCase()) {
            case 'COMPLETED':
                return <CheckCircle size={16} className="text-green-600" />
            case 'EXPIRED':
            case 'CANCELLED':
                return <XCircle size={16} className="text-red-600" />
            case 'PENDING_LANDLORD':
            case 'PENDING_TENANT':
                return <Clock size={16} className="text-yellow-600" />
            default:
                return <AlertCircle size={16} className="text-gray-600" />
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status.toUpperCase()) {
            case 'DRAFT':
                return 'Draft'
            case 'PENDING_LANDLORD':
                return 'Awaiting Landlord'
            case 'PENDING_TENANT':
                return 'Awaiting Tenant'
            case 'COMPLETED':
                return 'Completed'
            case 'EXPIRED':
                return 'Expired'
            case 'CANCELLED':
                return 'Cancelled'
            default:
                return status
        }
    }

    // Check if the current user needs to sign
    const needsToSign = (agreement: Agreement): boolean => {
        const role = getUserRole(agreement)
        if (role === 'landlord') {
            return !agreement.landlordSigned && (agreement.status === 'DRAFT' || agreement.status === 'PENDING_LANDLORD')
        } else {
            return !agreement.tenantSigned && agreement.status === 'PENDING_TENANT'
        }
    }

    if (!isLoggedIn) {
        return (
            <ContentWrapper>
                <div className="px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex-1 flex items-center justify-center py-10">
                        <div className="text-center space-y-6 max-w-md">
                            <h3 className="text-xl font-sans font-medium text-slate-900">
                                Please log in to view your agreements
                            </h3>
                            <Link
                                href="/auth"
                                className="inline-block px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                Log In
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="h-20 md:hidden"></div>
            </ContentWrapper>
        )
    }

    return (
        <ContentWrapper>
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                {/* Header */}
                <div className="max-w-6xl mx-auto mb-4 sm:mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <FileSignature size={24} className="text-indigo-600 sm:w-7 sm:h-7" />
                            <h3 className="text-xl sm:text-2xl font-serif text-slate-900">My Agreements</h3>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 hidden sm:block">
                        Manage and sign your rental agreements
                    </p>
                </div>

                {/* Role Filter Tabs */}
                <div className="flex space-x-1 sm:space-x-2 mt-4 border-b border-slate-200 overflow-x-auto">
                    <button
                        onClick={() => setRoleFilter('all')}
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${roleFilter === 'all'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        All ({agreements.length})
                    </button>
                    <button
                        onClick={() => setRoleFilter('landlord')}
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center space-x-1 sm:space-x-2 whitespace-nowrap ${roleFilter === 'landlord'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Home size={14} />
                        <span>As Landlord ({landlordCount})</span>
                    </button>
                    <button
                        onClick={() => setRoleFilter('tenant')}
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center space-x-1 sm:space-x-2 whitespace-nowrap ${roleFilter === 'tenant'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Key size={14} />
                        <span>As Tenant ({tenantCount})</span>
                    </button>
                </div>

                {/* Contents */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
                                <p className="text-slate-600">Loading your agreements...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center space-y-4">
                                <p className="text-red-600">{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    ) : filteredAgreements.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center py-10">
                            <div className="text-center space-y-6 max-w-md">
                                <FileSignature size={64} className="mx-auto text-slate-300" />
                                <div className="space-y-3">
                                    <h3 className="text-xl font-sans font-medium text-slate-900">
                                        {roleFilter === 'all'
                                            ? 'No agreements yet'
                                            : roleFilter === 'landlord'
                                                ? 'No agreements as landlord'
                                                : 'No agreements as tenant'}
                                    </h3>
                                    <p className="text-base text-slate-500 leading-relaxed">
                                        {roleFilter === 'landlord'
                                            ? 'When tenants book your properties, agreements will appear here.'
                                            : roleFilter === 'tenant'
                                                ? 'When you book properties, agreements will appear here.'
                                                : 'Agreements will appear here when you book or receive bookings.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredAgreements.map((agreement) => {
                                const userRole = getUserRole(agreement)
                                const actionNeeded = needsToSign(agreement)

                                return (
                                    <div
                                        key={agreement.id}
                                        className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow ${actionNeeded ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                                            }`}
                                    >
                                        <div className="flex flex-col md:flex-row">
                                            {/* Property Image */}
                                            <div className="md:w-1/4 relative">
                                                <div className="relative h-48 md:h-full min-h-[180px]">
                                                    <Image
                                                        src={agreement.lease.property.images?.[0] || '/placeholder-property.jpg'}
                                                        alt={agreement.lease.property.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    {/* Role Badge */}
                                                    <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-md ${userRole === 'landlord'
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-teal-600 text-white'
                                                        }`}>
                                                        {userRole === 'landlord' ? <Home size={12} /> : <Key size={12} />}
                                                        <span>{userRole === 'landlord' ? 'My Property' : 'My Rent'}</span>
                                                    </div>
                                                    {/* Action Needed Badge */}
                                                    {actionNeeded && (
                                                        <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500 text-white rounded-full text-xs font-semibold animate-pulse">
                                                            Action Required
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Agreement Details */}
                                            <div className="flex-1 p-6">
                                                <div className="flex flex-col h-full">
                                                    {/* Header */}
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h3 className="text-xl font-semibold text-slate-900 mb-1">
                                                                {agreement.lease.property.title}
                                                            </h3>
                                                            <div className="flex items-center text-slate-600 text-sm">
                                                                <MapPin size={14} className="mr-1" />
                                                                <span>{agreement.lease.property.address}, {agreement.lease.property.city}</span>
                                                            </div>
                                                        </div>
                                                        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(agreement.status)}`}>
                                                            {getStatusIcon(agreement.status)}
                                                            <span>{getStatusLabel(agreement.status)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Rental Period */}
                                                    <div className="flex items-center text-slate-600 mb-2">
                                                        <Calendar size={16} className="mr-2" />
                                                        <span className="text-sm">
                                                            {formatDate(agreement.lease.startDate)} - {formatDate(agreement.lease.endDate)}
                                                        </span>
                                                    </div>

                                                    {/* Other Party Info */}
                                                    <div className="flex items-center text-slate-600 mb-4">
                                                        <User size={16} className="mr-2" />
                                                        <span className="text-sm">
                                                            {userRole === 'landlord'
                                                                ? `Tenant: ${agreement.lease.tenant.name}`
                                                                : `Landlord: ${agreement.lease.landlord.name}`}
                                                        </span>
                                                    </div>

                                                    {/* Signature Status */}
                                                    <div className="flex flex-wrap gap-4 mb-4">
                                                        <div className={`flex items-center text-sm ${agreement.landlordSigned ? 'text-green-600' : 'text-slate-500'}`}>
                                                            {agreement.landlordSigned ? <CheckCircle size={16} className="mr-1" /> : <Clock size={16} className="mr-1" />}
                                                            Landlord: {agreement.landlordSigned ? 'Signed' : 'Pending'}
                                                            {userRole === 'landlord' && !agreement.landlordSigned && (
                                                                <span className="ml-1 text-amber-600 font-medium">(You)</span>
                                                            )}
                                                        </div>
                                                        <div className={`flex items-center text-sm ${agreement.tenantSigned ? 'text-green-600' : 'text-slate-500'}`}>
                                                            {agreement.tenantSigned ? <CheckCircle size={16} className="mr-1" /> : <Clock size={16} className="mr-1" />}
                                                            Tenant: {agreement.tenantSigned ? 'Signed' : 'Pending'}
                                                            {userRole === 'tenant' && !agreement.tenantSigned && (
                                                                <span className="ml-1 text-amber-600 font-medium">(You)</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Footer */}
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mt-auto space-y-3 sm:space-y-0">
                                                        <div className="text-sm text-slate-500">
                                                            Created: {formatDate(agreement.generatedAt)}
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                                            <Link
                                                                href={`/agreements/${agreement.leaseId}`}
                                                                className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm ${actionNeeded
                                                                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                                    }`}
                                                            >
                                                                <FileSignature size={16} />
                                                                <span>{actionNeeded ? 'Sign Now' : 'View Agreement'}</span>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Bottom spacing for mobile nav */}
                <div className="h-20 md:hidden"></div>
            </div>
        </ContentWrapper>
    )
}

export default MyAgreementsPage

