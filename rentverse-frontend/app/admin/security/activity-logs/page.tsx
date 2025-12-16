'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import useAuthStore from '@/stores/authStore'
import { forwardRequest } from '@/utils/apiForwarder'
import { Activity, Shield, AlertTriangle, Lock, TrendingUp, ArrowLeft, RefreshCw } from 'lucide-react'

interface Statistics {
    totalLogins24h: number
    failedLogins24h: number
    successfulLogins24h: number
    highRiskLogins24h: number
    lockedAccounts: number
    failureRate: number
}

interface DailyTrend {
    date: string
    total: number
    failed: number
    success: number
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

export default function ActivityLogsDashboard() {
    const router = useRouter()
    const { user, isLoggedIn } = useAuthStore()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

    const [statistics, setStatistics] = useState<Statistics | null>(null)
    const [trends, setTrends] = useState<DailyTrend[]>([])
    const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([])
    const [showFailedOnly, setShowFailedOnly] = useState(false)
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

            const [statsRes, loginsRes] = await Promise.all([
                forwardRequest('/api/admin/security/statistics', { headers }),
                forwardRequest('/api/admin/security/login-history?limit=50', { headers }),
            ])

            const statsData = await statsRes.json()
            const loginsData = await loginsRes.json()

            if (statsData?.success) {
                setStatistics({
                    totalLogins24h: statsData.data.summary.totalLogins24h,
                    failedLogins24h: statsData.data.summary.failedLogins24h,
                    successfulLogins24h: statsData.data.summary.successfulLogins24h,
                    highRiskLogins24h: statsData.data.summary.highRiskLogins24h,
                    lockedAccounts: statsData.data.summary.lockedAccounts,
                    failureRate: statsData.data.summary.failureRate,
                })
                setTrends(statsData.data.trends?.daily || [])
            }

            if (loginsData?.success) {
                setLoginHistory(loginsData.data.logins || [])
            }

            setLastUpdate(new Date())
        } catch (err: unknown) {
            console.error('Failed to fetch activity logs data:', err)
            setError('Failed to load activity logs dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const fetchDataSilent = async () => {
        try {
            const token = localStorage.getItem('authToken')
            const headers = { Authorization: `Bearer ${token}` }

            const [statsRes, loginsRes] = await Promise.all([
                forwardRequest('/api/admin/security/statistics', { headers }),
                forwardRequest('/api/admin/security/login-history?limit=50', { headers }),
            ])

            const statsData = await statsRes.json()
            const loginsData = await loginsRes.json()

            if (statsData?.success) {
                setStatistics({
                    totalLogins24h: statsData.data.summary.totalLogins24h,
                    failedLogins24h: statsData.data.summary.failedLogins24h,
                    successfulLogins24h: statsData.data.summary.successfulLogins24h,
                    highRiskLogins24h: statsData.data.summary.highRiskLogins24h,
                    lockedAccounts: statsData.data.summary.lockedAccounts,
                    failureRate: statsData.data.summary.failureRate,
                })
                setTrends(statsData.data.trends?.daily || [])
            }

            if (loginsData?.success) {
                setLoginHistory(loginsData.data.logins || [])
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
        if (score >= 40) return 'bg-amber-500'
        return 'bg-emerald-500'
    }

    const getRiskTextColor = (score: number) => {
        if (score >= 70) return 'text-red-700'
        if (score >= 40) return 'text-amber-700'
        return 'text-emerald-700'
    }

    const filteredLogins = showFailedOnly 
        ? loginHistory.filter(login => !login.success)
        : loginHistory

    if (loading || isChecking) {
        return (
            <ContentWrapper>
                <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center py-20">
                    <div className="text-center space-y-6">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
                            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-emerald-300 opacity-20 mx-auto"></div>
                        </div>
                        <p className="text-slate-700 font-medium">Loading activity logs dashboard...</p>
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
                                <Activity className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-sans font-bold text-slate-900 mb-2">
                                    Activity Logs & Login History
                                </h2>
                                <p className="text-slate-600">
                                    Monitor login attempts, failed logins, and risk scores
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-6 rounded-3xl shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="text-white">
                                    <p className="text-sm font-medium opacity-90 mb-1">Total Logins</p>
                                    <p className="text-4xl font-bold">{statistics.totalLogins24h}</p>
                                    <p className="text-xs opacity-80 mt-2">Last 24 hours</p>
                                </div>
                                <div className="p-4 bg-white/20 backdrop-blur rounded-2xl">
                                    <Activity className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-500 to-rose-500 p-6 rounded-3xl shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="text-white">
                                    <p className="text-sm font-medium opacity-90 mb-1">Failed Attempts</p>
                                    <p className="text-4xl font-bold">{statistics.failedLogins24h}</p>
                                    <p className="text-xs opacity-80 mt-2">{statistics.failureRate}% failure rate</p>
                                </div>
                                <div className="p-4 bg-white/20 backdrop-blur rounded-2xl">
                                    <AlertTriangle className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-6 rounded-3xl shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="text-white">
                                    <p className="text-sm font-medium opacity-90 mb-1">Successful Logins</p>
                                    <p className="text-4xl font-bold">{statistics.successfulLogins24h}</p>
                                    <p className="text-xs opacity-80 mt-2">Last 24 hours</p>
                                </div>
                                <div className="p-4 bg-white/20 backdrop-blur rounded-2xl">
                                    <Shield className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 rounded-3xl shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="text-white">
                                    <p className="text-sm font-medium opacity-90 mb-1">High Risk Logins</p>
                                    <p className="text-4xl font-bold">{statistics.highRiskLogins24h}</p>
                                    <p className="text-xs opacity-80 mt-2">Risk score ≥ 50</p>
                                </div>
                                <div className="p-4 bg-white/20 backdrop-blur rounded-2xl">
                                    <AlertTriangle className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-6 rounded-3xl shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="text-white">
                                    <p className="text-sm font-medium opacity-90 mb-1">Locked Accounts</p>
                                    <p className="text-4xl font-bold">{statistics.lockedAccounts}</p>
                                    <p className="text-xs opacity-80 mt-2">Currently locked</p>
                                </div>
                                <div className="p-4 bg-white/20 backdrop-blur rounded-2xl">
                                    <Lock className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 rounded-3xl shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="text-white">
                                    <p className="text-sm font-medium opacity-90 mb-1">Failure Rate</p>
                                    <p className="text-4xl font-bold">{statistics.failureRate}%</p>
                                    <p className="text-xs opacity-80 mt-2">Last 24 hours</p>
                                </div>
                                <div className="p-4 bg-white/20 backdrop-blur rounded-2xl">
                                    <TrendingUp className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7-Day Login Histogram */}
                <div className="bg-white rounded-3xl shadow-xl p-6 mb-8 border border-emerald-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">7-Day Login Histogram</h3>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-2 px-4">
                        {trends.map((day) => {
                            const maxValue = Math.max(...trends.map(t => t.total), 1);
                            const successHeight = (day.success / maxValue) * 100;
                            const failedHeight = (day.failed / maxValue) * 100;
                            
                            return (
                                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full flex flex-col justify-end h-56 gap-1">
                                        {/* Success Bar */}
                                        <div className="w-full flex flex-col items-center">
                                            <span className="text-xs font-bold text-emerald-600 mb-1">{day.success}</span>
                                            <div 
                                                className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg shadow-lg transition-all hover:scale-105"
                                                style={{ height: `${successHeight}%`, minHeight: day.success > 0 ? '8px' : '0px' }}
                                            />
                                        </div>
                                        {/* Failed Bar */}
                                        <div className="w-full flex flex-col items-center">
                                            <div 
                                                className="w-full bg-gradient-to-t from-red-500 to-rose-400 rounded-t-lg shadow-lg transition-all hover:scale-105"
                                                style={{ height: `${failedHeight}%`, minHeight: day.failed > 0 ? '8px' : '0px' }}
                                            />
                                            <span className="text-xs font-bold text-red-600 mt-1">{day.failed}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs font-medium text-slate-600 text-center">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        <div className="text-xs text-slate-400">
                                            {new Date(day.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex gap-8 mt-6 pt-4 border-t border-slate-100 justify-center">
                        <span className="flex items-center gap-2 text-sm font-medium">
                            <span className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded" /> Success Logins
                        </span>
                        <span className="flex items-center gap-2 text-sm font-medium">
                            <span className="w-4 h-4 bg-gradient-to-r from-red-500 to-rose-500 rounded" /> Failed Logins
                        </span>
                    </div>
                </div>

                {/* Login History Table */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-100">
                    <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
                        <h3 className="text-xl font-semibold text-slate-900">Login History</h3>
                        <label className="flex items-center gap-3 text-sm text-slate-700 font-medium cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showFailedOnly}
                                onChange={(e) => setShowFailedOnly(e.target.checked)}
                                className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                            />
                            Show failed only
                        </label>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gradient-to-r from-emerald-100 to-teal-100">
                                <tr>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-700">Time</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-700">User</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-700">Device</th>
                                    <th className="text-center px-6 py-4 font-semibold text-slate-700">Status</th>
                                    <th className="text-center px-6 py-4 font-semibold text-slate-700">Risk Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLogins.map((login) => (
                                    <tr key={login.id} className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all">
                                        <td className="px-6 py-4 text-slate-900 font-medium">{formatDate(login.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{login.user?.email || 'Unknown'}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{login.user?.firstName} {login.user?.lastName}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            <div className="font-medium">{login.browser}</div>
                                            <div className="text-xs text-slate-500">{login.os}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-semibold ${login.success 
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                                : 'bg-red-100 text-red-800 border border-red-200'
                                            }`}>
                                                {login.success ? 'Success' : 'Failed'}
                                            </span>
                                            {login.failReason && (
                                                <div className="text-xs text-red-600 mt-1 font-medium">{login.failReason}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white ${getRiskColor(login.riskScore)} shadow-md`}>
                                                    {login.riskScore}
                                                </span>
                                                <span className={`text-xs font-semibold ${getRiskTextColor(login.riskScore)}`}>
                                                    {login.riskScore >= 70 ? 'High' : login.riskScore >= 40 ? 'Medium' : 'Low'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredLogins.length === 0 && (
                            <div className="text-center py-16 text-slate-500">
                                <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="font-medium">No login history found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ContentWrapper>
    )
}
