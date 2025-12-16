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
    ToggleRight,
    Map,
    Grid3x3,
    DollarSign,
    TrendingUp,
    Sliders
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
    const [statistics, setStatistics] = useState<Statistics | null>(null)
    const [properties, setProperties] = useState<Property[]>([])
    const [statusFilter, setStatusFilter] = useState('all')
    const [cityFilter, setCityFilter] = useState('all')
    const [priceRange, setPriceRange] = useState({ min: '', max: '' })
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [togglingId, setTogglingId] = useState<string | null>(null)
    const [allProperties, setAllProperties] = useState<Property[]>([])
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([])

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
                    const props = propertiesData.data.properties || []
                    setAllProperties(props)
                    setProperties(props)
                    setFilteredProperties(props)
                }
            } catch (err) {
                console.error('Failed to fetch data:', err)
            } finally {
                setIsLoading(false)
                isInitialLoad.current = false
            }
        }

        fetchData()
    }, [statusFilter, debouncedSearch])

    // Apply city filter
    useEffect(() => {
        if (cityFilter === 'all') {
            setFilteredProperties(allProperties)
        } else {
            setFilteredProperties(allProperties.filter(p => p.city === cityFilter))
        }
    }, [cityFilter, allProperties])

    const clearFilters = () => {
        setCityFilter('all')
        setStatusFilter('all')
        setSearchQuery('')
        setPriceRange({ min: '', max: '' })
    }

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
            case 'APPROVED': return 'bg-emerald-500'
            case 'PENDING_REVIEW': return 'bg-amber-500'
            case 'REJECTED': return 'bg-red-500'
            default: return 'bg-slate-500'
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

    // Get unique cities
    const cities = Array.from(new Set(allProperties.map(p => p.city))).sort()
    
    // Use filtered properties for display
    const displayProperties = filteredProperties

    // Mock location clusters for map legend
    const locationClusters = [
        { city: 'Kuala Lumpur', count: Math.floor(properties.filter(p => p.city.includes('Kuala Lumpur')).length) || 12, color: 'emerald' },
        { city: 'Selangor', count: Math.floor(properties.filter(p => p.city.includes('Selangor')).length) || 8, color: 'teal' },
        { city: 'Penang', count: Math.floor(properties.filter(p => p.city.includes('Penang')).length) || 5, color: 'cyan' },
        { city: 'Johor', count: Math.floor(properties.filter(p => p.city.includes('Johor')).length) || 4, color: 'blue' },
    ]

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
                                Property Explorer
                            </h1>
                            <p className="text-sm sm:text-base text-slate-600 mt-1">Map-based location intelligence</p>
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* MAIN CONTENT AREA */}
                    <div className="lg:col-span-9 space-y-6">
                        {/* Map Placeholder */}
                        <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-100 overflow-hidden">
                            <div className="relative h-64 sm:h-80 bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <Map size={64} className="mx-auto text-emerald-400 mb-4" />
                                        <h3 className="text-xl font-bold text-slate-700 mb-2">Property Location Map</h3>
                                        <p className="text-slate-500 text-sm">Visual representation of properties across Malaysia</p>
                                    </div>
                                </div>
                                {/* Mock location pins */}
                                <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
                                <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-teal-500 rounded-full border-4 border-white shadow-lg animate-pulse animation-delay-200"></div>
                                <div className="absolute top-2/3 right-1/3 w-8 h-8 bg-cyan-500 rounded-full border-4 border-white shadow-lg animate-pulse animation-delay-400"></div>
                                <div className="absolute bottom-1/4 left-2/3 w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse animation-delay-600"></div>
                            </div>
                            <div className="p-4 bg-white border-t-2 border-emerald-100">
                                <div className="flex gap-6 text-sm">
                                    {locationClusters.map((cluster) => (
                                        <div key={cluster.city} className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full bg-${cluster.color}-500`}></div>
                                            <span className="text-slate-700 font-medium">{cluster.city}</span>
                                            <span className="text-slate-400">({cluster.count})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="bg-white rounded-2xl shadow-lg p-4 border-2 border-emerald-100">
                            <div className="relative">
                                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                                <input
                                    type="text"
                                    placeholder="Search properties by title, address, or owner..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-emerald-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Masonry Grid */}
                        <div className="columns-1 sm:columns-2 xl:columns-3 gap-4 space-y-4">
                            {displayProperties.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-3xl shadow-xl">
                                    <Building2 size={64} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 text-lg">No properties found</p>
                                </div>
                            ) : (
                                displayProperties.map((property, idx) => (
                                    <div
                                        key={property.id}
                                        className="break-inside-avoid bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all border-2 border-slate-100 overflow-hidden group"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        {/* Large Image */}
                                        <div className="relative h-56 overflow-hidden">
                                            <Image
                                                src={property.images?.[0] || '/placeholder-property.jpg'}
                                                alt={property.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                            
                                            {/* Status Badge */}
                                            <div className="absolute top-3 left-3">
                                                <span className={`px-3 py-1.5 ${getStatusColor(property.status)} text-white rounded-xl text-xs font-bold shadow-lg`}>
                                                    {property.status === 'PENDING_REVIEW' ? 'PENDING' : property.status}
                                                </span>
                                            </div>

                                            {/* Location Prominent */}
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <div className="flex items-center gap-2 text-white mb-2">
                                                    <MapPin size={18} className="flex-shrink-0" />
                                                    <span className="font-bold text-lg">{property.city}</span>
                                                </div>
                                                <p className="text-white/90 text-sm truncate">{property.address}</p>
                                            </div>
                                        </div>

                                        {/* Property Info */}
                                        <div className="p-4">
                                            <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-2">
                                                {property.title}
                                            </h3>

                                            {/* Price - Prominent */}
                                            <div className="mb-3">
                                                <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                                    {formatPrice(property.price, property.currencyCode)}
                                                </div>
                                                <span className="text-xs text-slate-400 font-medium">/month</span>
                                            </div>

                                            {/* Property Details */}
                                            <div className="flex items-center gap-3 text-xs text-slate-600 mb-3 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    {property.bedrooms} bed
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                                                    {property.bathrooms} bath
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                                                    {property.areaSqm} sqm
                                                </span>
                                            </div>

                                            {/* Engagement Stats */}
                                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                                                <span className="flex items-center gap-1">
                                                    <Eye size={14} className="text-slate-400" />
                                                    {property.viewCount}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Heart size={14} className="text-slate-400" />
                                                    {property.favoriteCount}
                                                </span>
                                                <span className="text-slate-400">{formatDate(property.createdAt)}</span>
                                            </div>

                                            {/* Owner */}
                                            <div className="text-xs text-slate-500 mb-3 pb-3 border-b border-slate-100">
                                                <span className="font-semibold text-slate-700">Owner:</span> {property.owner.name}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleAvailability(property.id)}
                                                    disabled={togglingId === property.id}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-md hover:shadow-lg ${
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
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR - Filters & Analytics */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Stats Cards */}
                        {statistics && (
                            <div className="space-y-4">
                                <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl shadow-xl border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <Building2 size={20} className="text-slate-600" />
                                        <TrendingUp size={16} className="text-emerald-600" />
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900">{statistics.totalProperties}</div>
                                    <div className="text-xs text-slate-500 font-medium">Total Properties</div>
                                </div>
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl shadow-xl border border-emerald-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <CheckCircle size={20} className="text-emerald-600" />
                                        <TrendingUp size={16} className="text-emerald-600" />
                                    </div>
                                    <div className="text-3xl font-bold text-emerald-700">{statistics.activeProperties}</div>
                                    <div className="text-xs text-emerald-600 font-medium">Active</div>
                                </div>
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl shadow-xl border border-amber-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <Clock size={20} className="text-amber-600" />
                                        <TrendingUp size={16} className="text-amber-600" />
                                    </div>
                                    <div className="text-3xl font-bold text-amber-700">{statistics.pendingApproval}</div>
                                    <div className="text-xs text-amber-600 font-medium">Pending</div>
                                </div>
                                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-5 rounded-2xl shadow-xl border border-teal-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <Star size={20} className="text-teal-600" />
                                        <TrendingUp size={16} className="text-teal-600" />
                                    </div>
                                    <div className="text-3xl font-bold text-teal-700">{statistics.createdLast7d}</div>
                                    <div className="text-xs text-teal-600 font-medium">New (7 days)</div>
                                </div>
                            </div>
                        )}

                        {/* Filters */}
                        <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-100 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Sliders size={20} className="text-emerald-600" />
                                <h3 className="font-bold text-slate-900">Filters</h3>
                            </div>

                            {/* Status Filter */}
                            <div className="mb-4">
                                <label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wide">Status</label>
                                <div className="space-y-2">
                                    {['all', 'APPROVED', 'PENDING_REVIEW', 'REJECTED'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`w-full px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                                                statusFilter === status
                                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {status === 'all' ? 'All' : status === 'PENDING_REVIEW' ? 'PENDING' : status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* City Filter */}
                            <div className="mb-4">
                                <label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wide">Location</label>
                                <select
                                    value={cityFilter}
                                    onChange={(e) => setCityFilter(e.target.value)}
                                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="all">All Cities</option>
                                    {cities.map((city) => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Clear Filters Button */}
                            {(cityFilter !== 'all' || statusFilter !== 'all' || searchQuery !== '' || priceRange.min !== '' || priceRange.max !== '') && (
                                <button
                                    onClick={clearFilters}
                                    className="w-full px-4 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-300 transition-all"
                                >
                                    Clear All Filters
                                </button>
                            )}

                            {/* Price Range */}
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wide">Price Range (MYR)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                        className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                        className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Price Heatmap Legend */}
                        <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-100 p-5">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <DollarSign size={20} className="text-emerald-600" />
                                Price Heatmap
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-emerald-500"></div>
                                        <span className="text-xs text-slate-600">Budget</span>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-900">&lt; RM 2,000</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-teal-500"></div>
                                        <span className="text-xs text-slate-600">Mid-Range</span>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-900">RM 2,000 - 4,000</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-cyan-500"></div>
                                        <span className="text-xs text-slate-600">Premium</span>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-900">RM 4,000 - 6,000</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-blue-500"></div>
                                        <span className="text-xs text-slate-600">Luxury</span>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-900">&gt; RM 6,000</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-20 md:hidden"></div>
            </div>
        </ContentWrapper>
    )
}
