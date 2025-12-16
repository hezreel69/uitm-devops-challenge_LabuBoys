'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import useAuthStore from '@/stores/authStore'
import { forwardRequest } from '@/utils/apiForwarder'
import { Bell, Mail, ArrowLeft, RefreshCw, Filter } from 'lucide-react'

interface Statistics {
    alertsSent24h: number
    newDevices24h: number
}

interface AlertByType {
    type: string
    count: number
}

interface AlertEntry {
    id: string
    type: string
    title: string
    message: string
    createdAt: string
    emailSent: boolean
    user: {
        email: string
        firstName: string
        lastName: string
    }
}

export default function NotificationsDashboard() {
    const router = useRouter()
    const { user, isLoggedIn } = useAuthStore()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

    const [statistics, setStatistics] = useState<Statistics | null>(null)
    const [alertsByType, setAlertsByType] = useState<AlertByType[]>([])
    const [alerts, setAlerts] = useState<AlertEntry[]>([])
    const [selectedAlertType, setSelectedAlertType] = useState<string>('all')
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('authToken')

        if (!token) {
            router.push('/auth')
            return
        }

        if (!isLoggedIn) {
            const timeout = setTimeout(() => {
                if (!isLoggedIn) {
                    router.push('/auth')
                }
            }, 1000)
            return () => clearTimeout(timeout)
        }

        if (user?.role !== 'ADMIN') {
            router.push('/')
            return
        }

        setIsChecking(false)
        fetchData()

        // Real-time polling every 10 seconds
        const pollInterval = setInterval(() => {
            fetchDataSilent()
        }, 10000)

        return () => clearInterval(pollInterval)
    }, [isLoggedIn, user, router])

    const fetchData = async () => {
        try {
            setLoading(true)
            setError(null)

            const token = localStorage.getItem('authToken')
            const headers = { Authorization: `Bearer ${token}` }

            const [statsRes, alertsRes] = await Promise.all([
                forwardRequest('/api/admin/security/statistics', { headers }),
                forwardRequest('/api/admin/security/alerts?limit=50', { headers }),
            ])

            const statsData = await statsRes.json()
            const alertsData = await alertsRes.json()

            if (statsData?.success) {
                setStatistics({
                    alertsSent24h: statsData.data.summary.alertsSent24h,
                    newDevices24h: statsData.data.summary.newDevices24h,
                })
                setAlertsByType(statsData.data.alertsByType || [])
            }

            if (alertsData?.success) {
                setAlerts(alertsData.data.alerts || [])
            }

            setLastUpdate(new Date())
        } catch (err: unknown) {
            console.error('Failed to fetch notifications data:', err)
            setError('Failed to load notifications dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const fetchDataSilent = async () => {
        try {
            const token = localStorage.getItem('authToken')
            const headers = { Authorization: `Bearer ${token}` }

            const [statsRes, alertsRes] = await Promise.all([
                forwardRequest('/api/admin/security/statistics', { headers }),
                forwardRequest('/api/admin/security/alerts?limit=50', { headers }),
            ])

            const statsData = await statsRes.json()
            const alertsData = await alertsRes.json()

            if (statsData?.success) {
                setStatistics({
                    alertsSent24h: statsData.data.summary.alertsSent24h,
                    newDevices24h: statsData.data.summary.newDevices24h,
                })
                setAlertsByType(statsData.data.alertsByType || [])
            }

            if (alertsData?.success) {
                setAlerts(alertsData.data.alerts || [])
            }

            setLastUpdate(new Date())
        } catch (err) {
            console.error('Silent fetch error:', err)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString()
    }

    const getAlertTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            NEW_DEVICE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            MULTIPLE_FAILURES: 'bg-red-100 text-red-800 border-red-200',
            ACCOUNT_LOCKED: 'bg-red-200 text-red-900 border-red-300',
            PASSWORD_CHANGED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            SUSPICIOUS_TIMING: 'bg-orange-100 text-orange-800 border-orange-200',
            NEW_LOCATION: 'bg-purple-100 text-purple-800 border-purple-200',
        }
        return colors[type] || 'bg-slate-100 text-slate-800 border-slate-200'
    }

    const filteredAlerts = selectedAlertType === 'all' 
        ? alerts 
        : alerts.filter(alert => alert.type === selectedAlertType)

    if (loading || isChecking) {
        return (
            <ContentWrapper>
                <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center py-20">
                    <div className="text-center space-y-6">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
                            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-emerald-300 opacity-20 mx-auto"></div>
                        </div>
                        <p className="text-slate-700 font-medium">Loading notifications dashboard...</p>
                    </div>
                </div>
            </ContentWrapper>
        )
    }

    if (error) {
        return (
            <ContentWrapper>
                <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center py-20">
                    <div className="text-center space-y-4 bg-white p-8 rounded-3xl shadow-xl">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button
                            onClick={fetchData}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </ContentWrapper>
        )
    }

    return (
        <ContentWrapper>
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12 px-4 md:px-16">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-start justify-between mb-6">
                        <button
                            onClick={() => router.push('/admin/security')}
                            className="flex items-center gap-2 px-4 py-2 text-emerald-700 hover:text-emerald-900 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back to Security</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg">
                                <Bell className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-sans font-bold text-slate-900 mb-2">
                                    Security Notifications & Alerts
                                </h2>
                                <p className="text-slate-600">
                                    Monitor security alerts, notification types, and email delivery status
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-slate-600 font-medium">
                                Last updated: {lastUpdate.toLocaleTimeString()}
                            </span>
                            <button
                                onClick={fetchData}
                                className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <RefreshCw size={16} />
                                <span className="text-sm font-medium">Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-6 rounded-3xl shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="text-white">
                                    <p className="text-sm font-medium opacity-90 mb-1">Alerts Sent</p>
                                    <p className="text-4xl font-bold">{statistics.alertsSent24h}</p>
                                    <p className="text-xs opacity-80 mt-2">Last 24 hours</p>
                                </div>
                                <div className="p-4 bg-white/20 backdrop-blur rounded-2xl">
                                    <Mail className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-6 rounded-3xl shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="text-white">
                                    <p className="text-sm font-medium opacity-90 mb-1">New Devices</p>
                                    <p className="text-4xl font-bold">{statistics.newDevices24h}</p>
                                    <p className="text-xs opacity-80 mt-2">Last 24 hours</p>
                                </div>
                                <div className="p-4 bg-white/20 backdrop-blur rounded-2xl">
                                    <Bell className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Alerts by Type */}
                    <div className="bg-white rounded-3xl shadow-xl p-6 border border-emerald-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                                <Filter className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Alerts by Type (7 days)</h3>
                        </div>
                        {alertsByType.length > 0 ? (
                            <div className="space-y-3">
                                {alertsByType.map((alert) => (
                                    <div 
                                        key={alert.type} 
                                        className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-emerald-50 hover:from-emerald-50 hover:to-teal-50 transition-all cursor-pointer"
                                        onClick={() => setSelectedAlertType(alert.type)}
                                    >
                                        <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${getAlertTypeColor(alert.type)}`}>
                                            {alert.type.replace(/_/g, ' ')}
                                        </span>
                                        <span className="font-bold text-slate-900 text-lg">{alert.count}</span>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setSelectedAlertType('all')}
                                    className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-xl hover:from-emerald-200 hover:to-teal-200 transition-all font-medium text-sm"
                                >
                                    Show All Types
                                </button>
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm text-center py-8">No alerts in the last 7 days</p>
                        )}
                    </div>

                    {/* Alerts List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-slate-900">
                                {selectedAlertType === 'all' ? 'All Alerts' : `${selectedAlertType.replace(/_/g, ' ')} Alerts`}
                            </h3>
                            <span className="text-sm text-slate-600">
                                Showing {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {filteredAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="bg-white rounded-3xl shadow-xl p-6 border border-emerald-100 hover:shadow-2xl transition-all duration-200"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className={`px-4 py-1.5 rounded-xl text-xs font-semibold border ${getAlertTypeColor(alert.type)}`}>
                                            {alert.type.replace(/_/g, ' ')}
                                        </span>
                                        {alert.emailSent && (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200">
                                                <Mail size={12} />
                                                Email Sent
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-slate-500 font-medium whitespace-nowrap ml-4">
                                        {formatDate(alert.createdAt)}
                                    </span>
                                </div>
                                <h4 className="font-semibold text-slate-900 mb-2 text-lg">{alert.title}</h4>
                                <p className="text-sm text-slate-600 mb-3 leading-relaxed">{alert.message}</p>
                                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                    <span className="text-xs text-slate-500">User:</span>
                                    <span className="text-xs font-medium text-slate-700">
                                        {alert.user?.email || 'Unknown'} ({alert.user?.firstName} {alert.user?.lastName})
                                    </span>
                                </div>
                            </div>
                        ))}

                        {filteredAlerts.length === 0 && (
                            <div className="text-center py-16 bg-white rounded-3xl shadow-xl border border-emerald-100">
                                <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">No security alerts found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ContentWrapper>
    )
}
