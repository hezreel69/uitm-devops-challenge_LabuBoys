'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import useAuthStore from '@/stores/authStore'
import { forwardRequest } from '@/utils/apiForwarder'
import { Shield, AlertTriangle, Users, Activity, Lock, RefreshCw } from 'lucide-react'

interface Statistics {
    totalLogins24h: number
    failedLogins24h: number
    successfulLogins24h: number
    highRiskLogins24h: number
    alertsSent24h: number
    newDevices24h: number
    uniqueUsers24h: number
    lockedAccounts: number
    failureRate: number
}

interface DailyTrend {
    date: string
    total: number
    failed: number
    success: number
}

interface AlertByType {
    type: string
    count: number
}

interface LoginEntry {
    id: string
    userId: string
    ipAddress: string
    userAgent: string
    deviceType: string
    browser: string
    os: string
    success: boolean
    failReason: string | null
    riskScore: number
    createdAt: string
    user: {
        id: string
        email: string
        firstName: string
        lastName: string
        role: string
    }
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

export default function SecurityDashboard() {
    const router = useRouter()
    const { user, isLoggedIn } = useAuthStore()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'logins' | 'alerts'>('overview')
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

    const [statistics, setStatistics] = useState<Statistics | null>(null)
    const [trends, setTrends] = useState<DailyTrend[]>([])
    const [alertsByType, setAlertsByType] = useState<AlertByType[]>([])
    const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([])
    const [alerts, setAlerts] = useState<AlertEntry[]>([])
    const [showFailedOnly, setShowFailedOnly] = useState(false)
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        // Check localStorage directly to prevent redirect on page refresh
        const token = localStorage.getItem('authToken')

        if (!token) {
            router.push('/auth')
            return
        }

        // Wait for auth store to be hydrated
        if (!isLoggedIn) {
            // Give auth store time to hydrate
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

            const [statsRes, loginsRes, alertsRes] = await Promise.all([
                forwardRequest('/api/admin/security/statistics', { headers }),
                forwardRequest('/api/admin/security/login-history?limit=50', { headers }),
                forwardRequest('/api/admin/security/alerts?limit=50', { headers }),
            ])

            const statsData = await statsRes.json()
            const loginsData = await loginsRes.json()
            const alertsData = await alertsRes.json()

            if (statsData?.success) {
                setStatistics(statsData.data.summary)
                setTrends(statsData.data.trends?.daily || [])
                setAlertsByType(statsData.data.alertsByType || [])
            }

            if (loginsData?.success) {
                setLoginHistory(loginsData.data.logins || [])
            }

            if (alertsData?.success) {
                setAlerts(alertsData.data.alerts || [])
            }

            setLastUpdate(new Date())
        } catch (err: unknown) {
            console.error('Failed to fetch security data:', err)
            setError('Failed to load security dashboard data')
        } finally {
            setLoading(false)
        }
    }

    // Silent fetch for real-time updates (no loading spinner)
    const fetchDataSilent = async () => {
        try {
            const token = localStorage.getItem('authToken')
            const headers = { Authorization: `Bearer ${token}` }

            const [statsRes, loginsRes, alertsRes] = await Promise.all([
                forwardRequest('/api/admin/security/statistics', { headers }),
                forwardRequest('/api/admin/security/login-history?limit=50', { headers }),
                forwardRequest('/api/admin/security/alerts?limit=50', { headers }),
            ])

            const statsData = await statsRes.json()
            const loginsData = await loginsRes.json()
            const alertsData = await alertsRes.json()

            if (statsData?.success) {
                setStatistics(statsData.data.summary)
                setTrends(statsData.data.trends?.daily || [])
                setAlertsByType(statsData.data.alertsByType || [])
            }

            if (loginsData?.success) {
                setLoginHistory(loginsData.data.logins || [])
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

    const getRiskColor = (score: number) => {
        if (score >= 70) return 'bg-red-500'
        if (score >= 40) return 'bg-yellow-500'
        return 'bg-green-500'
    }

    const getAlertTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            NEW_DEVICE: 'bg-yellow-100 text-yellow-800',
            MULTIPLE_FAILURES: 'bg-red-100 text-red-800',
            ACCOUNT_LOCKED: 'bg-red-200 text-red-900',
            PASSWORD_CHANGED: 'bg-green-100 text-green-800',
            SUSPICIOUS_TIMING: 'bg-orange-100 text-orange-800',
            NEW_LOCATION: 'bg-purple-100 text-purple-800',
        }
        return colors[type] || 'bg-slate-100 text-slate-800'
    }

    if (loading || isChecking) {
        return (
            <ContentWrapper>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
                        <p className="text-slate-600">Loading security dashboard...</p>
                    </div>
                </div>
            </ContentWrapper>
        )
    }

    if (error) {
        return (
            <ContentWrapper>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center space-y-4">
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={fetchData}
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
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
            <div className="py-12 px-4 md:px-16">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-sans font-bold text-slate-900 mb-2">Security Dashboard</h2>
                            <p className="text-slate-600">Monitor login activity, security alerts, and potential threats</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-slate-500">
                                Last updated: {lastUpdate.toLocaleTimeString()}
                            </span>
                            <button
                                onClick={fetchData}
                                className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors duration-200"
                            >
                                <RefreshCw size={16} />
                                <span className="text-sm font-medium">Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Total Logins</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">{statistics.totalLogins24h}</p>
                                    <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Failed Attempts</p>
                                    <p className="text-2xl font-bold text-red-600 mt-1">{statistics.failedLogins24h}</p>
                                    <p className="text-xs text-slate-500 mt-1">{statistics.failureRate}% failure rate</p>
                                </div>
                                <div className="p-3 bg-red-100 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">High Risk</p>
                                    <p className="text-2xl font-bold text-yellow-600 mt-1">{statistics.highRiskLogins24h}</p>
                                    <p className="text-xs text-slate-500 mt-1">Risk score ≥ 50</p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-lg">
                                    <Shield className="w-5 h-5 text-yellow-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Locked Accounts</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">{statistics.lockedAccounts}</p>
                                    <p className="text-xs text-slate-500 mt-1">Currently locked</p>
                                </div>
                                <div className="p-3 bg-slate-100 rounded-lg">
                                    <Lock className="w-5 h-5 text-slate-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">New Devices</p>
                                    <p className="text-2xl font-bold text-purple-600 mt-1">{statistics.newDevices24h}</p>
                                    <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Users className="w-5 h-5 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Alerts Sent</p>
                                    <p className="text-2xl font-bold text-teal-600 mt-1">{statistics.alertsSent24h}</p>
                                    <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
                                </div>
                                <div className="p-3 bg-teal-100 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-teal-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex items-center space-x-2 mb-6 border-b border-slate-200">
                    {(['overview', 'logins', 'alerts'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab
                                ? 'border-teal-600 text-teal-600'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            {tab === 'overview' && '📈 Overview'}
                            {tab === 'logins' && '🔑 Login History'}
                            {tab === 'alerts' && '🔔 Security Alerts'}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 7-Day Trend */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">7-Day Login Trend</h3>
                            <div className="space-y-3">
                                {trends.map((day) => (
                                    <div key={day.date} className="flex items-center gap-4">
                                        <span className="w-24 text-sm text-slate-600">
                                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                        <div className="flex-1 flex h-6 rounded overflow-hidden bg-slate-100">
                                            <div
                                                className="bg-green-500 transition-all"
                                                style={{ width: `${day.total > 0 ? (day.success / day.total) * 100 : 0}%` }}
                                            />
                                            <div
                                                className="bg-red-500 transition-all"
                                                style={{ width: `${day.total > 0 ? (day.failed / day.total) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <span className="w-20 text-sm text-slate-600 text-right">
                                            {day.success}✓ {day.failed}✗
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-6 mt-4 text-sm">
                                <span className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-green-500 rounded" /> Success
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-red-500 rounded" /> Failed
                                </span>
                            </div>
                        </div>

                        {/* Alerts by Type */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Alerts by Type (7 days)</h3>
                            {alertsByType.length > 0 ? (
                                <div className="space-y-3">
                                    {alertsByType.map((alert) => (
                                        <div key={alert.type} className="flex items-center justify-between">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAlertTypeColor(alert.type)}`}>
                                                {alert.type.replace(/_/g, ' ')}
                                            </span>
                                            <span className="font-semibold text-slate-900">{alert.count}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm">No alerts in the last 7 days</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Logins Tab */}
                {activeTab === 'logins' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">Login History</h3>
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={showFailedOnly}
                                    onChange={(e) => setShowFailedOnly(e.target.checked)}
                                    className="rounded border-slate-300"
                                />
                                Show failed only
                            </label>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium text-slate-600">Time</th>
                                        <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                                        <th className="text-left px-4 py-3 font-medium text-slate-600">IP</th>
                                        <th className="text-left px-4 py-3 font-medium text-slate-600">Device</th>
                                        <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
                                        <th className="text-center px-4 py-3 font-medium text-slate-600">Risk</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loginHistory
                                        .filter(login => !showFailedOnly || !login.success)
                                        .map((login) => (
                                            <tr key={login.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-slate-900">{formatDate(login.createdAt)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-900">{login.user?.email || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-500">{login.user?.firstName} {login.user?.lastName}</div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{login.ipAddress}</td>
                                                <td className="px-4 py-3 text-slate-600">{login.browser} / {login.os}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${login.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {login.success ? '✓ Success' : '✗ Failed'}
                                                    </span>
                                                    {login.failReason && (
                                                        <div className="text-xs text-red-600 mt-1">{login.failReason}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getRiskColor(login.riskScore)}`}>
                                                        {login.riskScore}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            {loginHistory.length === 0 && (
                                <div className="text-center py-12 text-slate-500">No login history found</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Alerts Tab */}
                {activeTab === 'alerts' && (
                    <div className="space-y-4">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAlertTypeColor(alert.type)}`}>
                                            {alert.type.replace(/_/g, ' ')}
                                        </span>
                                        {alert.emailSent && (
                                            <span className="text-xs text-green-600">✉️ Email sent</span>
                                        )}
                                    </div>
                                    <span className="text-sm text-slate-500">{formatDate(alert.createdAt)}</span>
                                </div>
                                <h4 className="font-semibold text-slate-900 mb-1">{alert.title}</h4>
                                <p className="text-sm text-slate-600 mb-2">{alert.message}</p>
                                <p className="text-xs text-slate-500">User: {alert.user?.email || 'Unknown'}</p>
                            </div>
                        ))}
                        {alerts.length === 0 && (
                            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
                                No security alerts found
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ContentWrapper>
    )
}
