'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import {
    Building2,
    CheckCircle,
    Clock,
    XCircle,
    Search,
    ChevronRight,
    Loader2,
    Eye,
    Heart,
    Star,
    MapPin,
    ToggleLeft,
    ToggleRight
} from 'lucide-react'
import { createApiUrl } from '@/utils/apiConfig'
import Image from 'next/image'

interface Property {
    id: string
    title: string
    address: string
    city: string
    state: string
    price: string
    currencyCode: string
    bedrooms: number
    bathrooms: number
    areaSqm: number
    status: string
    isAvailable: boolean
    isFeatured?: boolean
    viewCount: number
    favoriteCount: number
    images: string[]
    createdAt: string
    owner: {
        id: string
        name: string
        email: string
    }
    propertyType: {
        id: string
        name: string
        icon: string
    }
}

interface Statistics {
    totalProperties: number
    activeProperties: number
    pendingApproval: number
    approvedProperties: number
    rejectedProperties: number
    createdLast7d: number
    approvalRate: number
}

export default function AdminPropertiesPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [statistics, setStatistics] = useState<Statistics | null>(null)
    const [properties, setProperties] = useState<Property[]>([])
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [togglingId, setTogglingId] = useState<string | null>(null)

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
                // Only show full loading on initial load
                if (isInitialLoad.current) {
                    setIsLoading(true)
                } else {
                    setIsRefetching(true)
                }

                const token = localStorage.getItem('authToken')
                const headers = { Authorization: `Bearer ${token}` }

                const [statsRes, propertiesRes] = await Promise.all([
                    fetch(createApiUrl('admin/properties/statistics'), { headers }),
                    fetch(createApiUrl(`admin/properties?status=${statusFilter}&search=${debouncedSearch}&limit=50`), { headers }),
                ])

                const statsData = await statsRes.json()
                const propertiesData = await propertiesRes.json()

                if (statsData?.success) {
                    setStatistics(statsData.data.summary)
                }

                if (propertiesData?.success) {
                    setProperties(propertiesData.data.properties || [])
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
    }, [statusFilter, debouncedSearch])

    const handleToggleAvailability = async (propertyId: string) => {
        try {
            setTogglingId(propertyId)
            const token = localStorage.getItem('authToken')

            const response = await fetch(createApiUrl(`admin/properties/${propertyId}/toggle-availability`), {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            })

            const data = await response.json()

            if (data.success) {
                setProperties(prev => prev.map(p =>
                    p.id === propertyId ? { ...p, isAvailable: data.data.isAvailable } : p
                ))
            }
        } catch (err) {
            console.error('Error toggling availability:', err)
        } finally {
            setTogglingId(null)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700'
            case 'PENDING_REVIEW': return 'bg-amber-100 text-amber-700'
            case 'REJECTED': return 'bg-red-100 text-red-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    const formatPrice = (price: string, currency: string) => {
        const num = parseFloat(price)
        return new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency: currency || 'MYR',
            minimumFractionDigits: 0
        }).format(num)
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
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center space-x-3">
                        <Building2 size={28} className="text-teal-600" />
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Properties Management</h1>
                            <p className="text-sm text-slate-500 hidden sm:block">View and manage all platform properties</p>
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
                                    <p className="text-xl sm:text-2xl font-bold text-slate-900">{statistics.totalProperties}</p>
                                </div>
                                <Building2 size={20} className="text-slate-400" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-green-600">Active</p>
                                    <p className="text-xl sm:text-2xl font-bold text-green-700">{statistics.activeProperties}</p>
                                </div>
                                <CheckCircle size={20} className="text-green-400" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-amber-600">Pending</p>
                                    <p className="text-xl sm:text-2xl font-bold text-amber-700">{statistics.pendingApproval}</p>
                                </div>
                                <Clock size={20} className="text-amber-400" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-500">New (7d)</p>
                                    <p className="text-xl sm:text-2xl font-bold text-slate-900">{statistics.createdLast7d}</p>
                                </div>
                                <Star size={20} className="text-slate-400" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by title, address, or owner..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {['all', 'APPROVED', 'PENDING_REVIEW', 'REJECTED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${statusFilter === status
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {status === 'all' ? 'All' : status === 'PENDING_REVIEW' ? 'PENDING' : status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Properties List */}
                <div className="space-y-4">
                    {properties.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500">No properties found</p>
                        </div>
                    ) : (
                        properties.map((property) => (
                            <div
                                key={property.id}
                                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col sm:flex-row">
                                    {/* Property Image */}
                                    <div className="sm:w-32 md:w-48 relative">
                                        <div className="h-32 sm:h-full relative">
                                            <Image
                                                src={property.images?.[0] || '/placeholder-property.jpg'}
                                                alt={property.title}
                                                fill
                                                className="object-cover"
                                            />
                                            <span className={`absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(property.status)}`}>
                                                {property.status === 'PENDING_REVIEW' ? 'PENDING' : property.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                            <div>
                                                <h3 className="font-semibold text-slate-900 text-sm sm:text-base line-clamp-1">
                                                    {property.title}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1">
                                                    <MapPin size={12} />
                                                    {property.address}, {property.city}
                                                </p>
                                            </div>
                                            <p className="text-base sm:text-lg font-bold text-teal-600">
                                                {formatPrice(property.price, property.currencyCode)}
                                                <span className="text-xs text-slate-400 font-normal">/mo</span>
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-slate-600 mb-3">
                                            <span>{property.bedrooms} bed</span>
                                            <span>{property.bathrooms} bath</span>
                                            <span>{property.areaSqm} sqm</span>
                                            <span className="flex items-center gap-1">
                                                <Eye size={12} /> {property.viewCount}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Heart size={12} /> {property.favoriteCount}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-slate-500">
                                                <span className="font-medium">Owner:</span> {property.owner.name}
                                                <span className="mx-2">•</span>
                                                {formatDate(property.createdAt)}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleAvailability(property.id)}
                                                    disabled={togglingId === property.id}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${property.isAvailable
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}
                                                >
                                                    {togglingId === property.id ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : property.isAvailable ? (
                                                        <ToggleRight size={14} />
                                                    ) : (
                                                        <ToggleLeft size={14} />
                                                    )}
                                                    {property.isAvailable ? 'Active' : 'Inactive'}
                                                </button>
                                                <Link
                                                    href={`/property/${property.id}`}
                                                    className="px-3 py-1.5 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 transition-colors"
                                                >
                                                    View
                                                </Link>
                                            </div>
                                        </div>
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
