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
            case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            case 'PENDING_REVIEW': return 'bg-amber-100 text-amber-700 border border-amber-200'
            case 'REJECTED': return 'bg-red-100 text-red-700 border border-red-200'
            default: return 'bg-slate-100 text-slate-700 border border-slate-200'
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
                            <Building2 size={32} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                Properties Management
                            </h1>
                            <p className="text-sm sm:text-base text-slate-600 mt-1">View and manage all platform properties</p>
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
                                    <p className="text-xs sm:text-sm text-slate-500 font-medium mb-1">Total</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">{statistics.totalProperties}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
                                    <Building2 size={24} className="text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 sm:p-6 rounded-2xl shadow-xl border border-emerald-200 hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-emerald-600 font-medium mb-1">Active</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{statistics.activeProperties}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                    <CheckCircle size={24} className="text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 sm:p-6 rounded-2xl shadow-xl border border-amber-200 hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-amber-600 font-medium mb-1">Pending</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-amber-700">{statistics.pendingApproval}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                    <Clock size={24} className="text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-5 sm:p-6 rounded-2xl shadow-xl border border-teal-200 hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-teal-600 font-medium mb-1">New (7d)</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-teal-700">{statistics.createdLast7d}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                                    <Star size={24} className="text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by title, address, or owner..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['all', 'APPROVED', 'PENDING_REVIEW', 'REJECTED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all shadow-md ${
                                    statusFilter === status
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg scale-105'
                                        : 'bg-white text-slate-600 hover:bg-slate-50 hover:shadow-lg'
                                }`}
                            >
                                {status === 'all' ? 'All' : status === 'PENDING_REVIEW' ? 'PENDING' : status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Properties List */}
                <div className="space-y-5">
                    {properties.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl shadow-xl">
                            <Building2 size={64} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 text-lg">No properties found</p>
                        </div>
                    ) : (
                        properties.map((property) => (
                            <div
                                key={property.id}
                                className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all hover:scale-[1.01] border border-slate-100"
                            >
                                <div className="flex flex-col sm:flex-row">
                                    {/* Property Image */}
                                    <div className="sm:w-48 md:w-64 relative">
                                        <div className="h-48 sm:h-full relative">
                                            <Image
                                                src={property.images?.[0] || '/placeholder-property.jpg'}
                                                alt={property.title}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                                            <span className={`absolute top-3 left-3 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg ${getStatusColor(property.status)}`}>
                                                {property.status === 'PENDING_REVIEW' ? 'PENDING' : property.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 p-5 sm:p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-base sm:text-lg line-clamp-1 mb-1">
                                                    {property.title}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
                                                    <MapPin size={14} className="text-teal-500" />
                                                    {property.address}, {property.city}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                                    {formatPrice(property.price, property.currencyCode)}
                                                </p>
                                                <span className="text-xs text-slate-400 font-medium">/month</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-slate-600 mb-4 font-medium">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                {property.bedrooms} bed
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                                {property.bathrooms} bath
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                                                {property.areaSqm} sqm
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Eye size={14} className="text-slate-400" />
                                                {property.viewCount}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Heart size={14} className="text-slate-400" />
                                                {property.favoriteCount}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                            <div className="text-xs text-slate-500">
                                                <span className="font-semibold text-slate-700">Owner:</span> {property.owner.name}
                                                <span className="mx-2 text-slate-300">•</span>
                                                <span className="text-slate-400">{formatDate(property.createdAt)}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleAvailability(property.id)}
                                                    disabled={togglingId === property.id}
                                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-md hover:shadow-lg ${
                                                        property.isAvailable
                                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                                                            : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                                                    }`}
                                                >
                                                    {togglingId === property.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : property.isAvailable ? (
                                                        <ToggleRight size={16} />
                                                    ) : (
                                                        <ToggleLeft size={16} />
                                                    )}
                                                    {property.isAvailable ? 'Active' : 'Inactive'}
                                                </button>
                                                <Link
                                                    href={`/property/${property.id}`}
                                                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold rounded-xl hover:shadow-lg transition-all shadow-md"
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
