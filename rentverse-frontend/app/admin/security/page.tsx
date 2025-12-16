'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ContentWrapper from '@/components/ContentWrapper';
import useAuthStore from '@/stores/authStore';
import { forwardRequest } from '@/utils/apiForwarder';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Bell, 
  Lock, 
  RefreshCw,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Minus,
  AlertCircle
} from 'lucide-react';

interface Statistics {
  totalLogins24h: number;
  failedLogins24h: number;
  successfulLogins24h: number;
  alertsSent24h: number;
  newDevices24h: number;
  uniqueUsers24h: number;
  lockedAccounts: number;
  failureRate: number;
}

interface RiskAnalysis {
  totalScore: number;
  riskLevel: string;
  riskColor: string;
  trend: string;
  breakdown: {
    failedLogins: { score: number; count: number; weight: string };
    accountLockouts: { score: number; count: number; weight: string };
    newDevices: { score: number; count: number; weight: string };
    rapidAttacks: { score: number; maxFromSingleIP: number; weight: string };
    unreviewedAlerts: { score: number; count: number; weight: string };
  };
  recommendations: Array<{
    priority: string;
    action: string;
    reason: string;
  }>;
}

export default function SecurityDashboard() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      router.push('/auth');
      return;
    }

    if (!isLoggedIn) {
      const timeout = setTimeout(() => {
        if (!isLoggedIn) {
          router.push('/auth');
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }

    if (user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    setIsChecking(false);
    fetchData();

    const pollInterval = setInterval(() => {
      fetchDataSilent();
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [isLoggedIn, user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, riskRes] = await Promise.all([
        forwardRequest('/api/admin/security/statistics', { headers }),
        forwardRequest('/api/admin/security/risk-analysis?timeWindow=24', { headers }),
      ]);

      const statsData = await statsRes.json();
      const riskData = await riskRes.json();

      console.log('[Security Dashboard] Stats Response:', statsData);
      console.log('[Security Dashboard] Risk Response:', riskData);

      if (statsData?.success) {
        setStatistics(statsData.data.summary);
      } else {
        console.warn('[Security Dashboard] Stats API failed:', statsData);
      }

      if (riskData?.success) {
        setRiskAnalysis(riskData.data);
        console.log('[Security Dashboard] Risk Analysis Set:', riskData.data);
      } else {
        console.warn('[Security Dashboard] Risk API failed:', riskData);
      }

      setLastUpdate(new Date());
    } catch (err: unknown) {
      console.error('Failed to fetch security data:', err);
      setError('Failed to load security dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDataSilent = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, riskRes] = await Promise.all([
        forwardRequest('/api/admin/security/statistics', { headers }),
        forwardRequest('/api/admin/security/risk-analysis?timeWindow=24', { headers }),
      ]);

      const statsData = await statsRes.json();
      const riskData = await riskRes.json();

      if (statsData?.success) {
        setStatistics(statsData.data.summary);
      }

      if (riskData?.success) {
        setRiskAnalysis(riskData.data);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Silent fetch error:', err);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'emerald';
      case 'moderate':
        return 'yellow';
      case 'high':
        return 'orange';
      case 'critical':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      case 'info':
      default:
        return 'blue';
    }
  };

  if (loading || isChecking) {
    return (
      <ContentWrapper>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield size={32} className="text-emerald-600 animate-pulse" />
              </div>
            </div>
            <p className="text-slate-600 font-medium">Loading security dashboard...</p>
          </div>
        </div>
      </ContentWrapper>
    );
  }

  if (error) {
    return (
      <ContentWrapper>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-red-200 p-12 text-center max-w-md">
            <AlertTriangle size={64} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Error</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={fetchData}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-xl transition-all duration-200 font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      </ContentWrapper>
    );
  }

  const riskColor = getRiskColor(riskAnalysis?.riskLevel || 'low');

  return (
    <ContentWrapper>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl">
                    <Shield size={32} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Security Dashboard
                    </h1>
                    <p className="text-slate-600 mt-1">
                      Monitor login activity, security alerts, and potential threats
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <span className="text-sm text-slate-500">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </span>
                  <button
                    onClick={fetchData}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-xl transition-all duration-200 font-semibold"
                  >
                    <RefreshCw size={18} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <Link
                href="/admin"
                className="inline-flex items-center space-x-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
              >
                <span>← Back to Admin Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Overview Stats */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-3xl shadow-xl border-2 border-blue-200 p-6 hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl">
                    <Activity size={24} className="text-white" />
                  </div>
                  <TrendingUp size={20} className="text-blue-400" />
                </div>
                <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-1">
                  Total Logins
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {statistics.totalLogins24h}
                </div>
                <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
              </div>

              <div className="bg-white rounded-3xl shadow-xl border-2 border-red-200 p-6 hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-gradient-to-br from-red-400 to-orange-400 rounded-2xl">
                    <AlertTriangle size={24} className="text-white" />
                  </div>
                  <Eye size={20} className="text-red-400" />
                </div>
                <div className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-1">
                  Failed Attempts
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  {statistics.failedLogins24h}
                </div>
                <p className="text-xs text-slate-500 mt-1">{statistics.failureRate}% failure rate</p>
              </div>

              <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 p-6 hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-gradient-to-br from-slate-400 to-slate-500 rounded-2xl">
                    <Lock size={24} className="text-white" />
                  </div>
                  <Lock size={20} className="text-slate-400" />
                </div>
                <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  Locked Accounts
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">
                  {statistics.lockedAccounts}
                </div>
                <p className="text-xs text-slate-500 mt-1">Currently locked</p>
              </div>

              <div className="bg-white rounded-3xl shadow-xl border-2 border-purple-200 p-6 hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-2xl">
                    <Users size={24} className="text-white" />
                  </div>
                  <Users size={20} className="text-purple-400" />
                </div>
                <div className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-1">
                  New Devices
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {statistics.newDevices24h}
                </div>
                <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
              </div>

              <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-200 p-6 hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl">
                    <Bell size={24} className="text-white" />
                  </div>
                  <Bell size={20} className="text-emerald-400" />
                </div>
                <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-1">
                  Alerts Sent
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {statistics.alertsSent24h}
                </div>
                <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
              </div>
            </div>
          )}

          {/* Dashboard Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Link href="/admin/security/activity-logs">
              <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <Activity size={32} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">
                        Activity Log Dashboard
                      </h2>
                      <p className="text-slate-600">
                        Monitor login attempts and user activity
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={32} className="text-emerald-500 group-hover:translate-x-2 transition-transform duration-300" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-200">
                    <div className="text-sm text-blue-600 font-semibold mb-1">Total Logins</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {statistics?.totalLogins24h || 0}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-4 border border-red-200">
                    <div className="text-sm text-red-600 font-semibold mb-1">Failed Logins</div>
                    <div className="text-2xl font-bold text-red-700">
                      {statistics?.failedLogins24h || 0}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-200 col-span-2">
                    <div className="text-sm text-emerald-600 font-semibold mb-1">Success Rate</div>
                    <div className="text-2xl font-bold text-emerald-700">
                      {statistics ? Math.round(100 - statistics.failureRate) : 0}%
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center text-emerald-600 font-semibold group-hover:text-emerald-700">
                  <span>View detailed activity logs</span>
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </Link>

            <Link href="/admin/security/notifications">
              <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <Bell size={32} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">
                        Smart Notification & Alert System
                      </h2>
                      <p className="text-slate-600">
                        Track security alerts and notifications
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={32} className="text-emerald-500 group-hover:translate-x-2 transition-transform duration-300" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-200">
                    <div className="text-sm text-emerald-600 font-semibold mb-1">Alerts Sent</div>
                    <div className="text-2xl font-bold text-emerald-700">
                      {statistics?.alertsSent24h || 0}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-200">
                    <div className="text-sm text-purple-600 font-semibold mb-1">New Devices</div>
                    <div className="text-2xl font-bold text-purple-700">
                      {statistics?.newDevices24h || 0}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-200 col-span-2">
                    <div className="text-sm text-blue-600 font-semibold mb-1">Active Users (24h)</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {statistics?.uniqueUsers24h || 0}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center text-emerald-600 font-semibold group-hover:text-emerald-700">
                  <span>View all notifications & alerts</span>
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </Link>
          </div>

          {/* Risk Analysis Section */}
          
          {!riskAnalysis && (
            <div className="bg-red-100 border border-red-400 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-red-800 mb-2">Risk Analysis Not Available</h3>
              <p className="text-sm text-red-600">
                The risk analysis endpoint is not returning data. Please check:
              </p>
              <ul className="list-disc ml-5 mt-2 text-sm text-red-600">
                <li>Backend server is running</li>
                <li>API endpoint /api/admin/security/risk-analysis is accessible</li>
                <li>Check browser console for error messages</li>
              </ul>
            </div>
          )}
          
          {riskAnalysis && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-3">
                <Shield size={28} className="text-emerald-600" />
                <span>Real-Time Risk Analysis</span>
              </h2>

              {/* Risk Score Card */}
              <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Risk Gauge */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center">
                    <div className="relative w-48 h-48">
                      <svg className="transform -rotate-90 w-48 h-48">
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="transparent"
                          className="text-gray-200"
                        />
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray={`${(riskAnalysis.totalScore / 100) * 552.64} 552.64`}
                          className={`text-${riskColor}-500 transition-all duration-1000`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className={`text-5xl font-bold text-${riskColor}-600`}>
                          {riskAnalysis.totalScore}
                        </div>
                        <div className="text-sm text-slate-600">Risk Score</div>
                      </div>
                    </div>
                    <div className={`mt-4 px-6 py-2 bg-${riskColor}-100 rounded-full`}>
                      <span className={`text-sm font-bold text-${riskColor}-700 uppercase`}>
                        {riskAnalysis.riskLevel}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      {riskAnalysis.trend === 'increasing' && (
                        <>
                          <TrendingUp size={16} className="text-red-500" />
                          <span className="text-sm text-red-600 font-medium">Increasing</span>
                        </>
                      )}
                      {riskAnalysis.trend === 'decreasing' && (
                        <>
                          <TrendingDown size={16} className="text-emerald-500" />
                          <span className="text-sm text-emerald-600 font-medium">Decreasing</span>
                        </>
                      )}
                      {riskAnalysis.trend === 'stable' && (
                        <>
                          <Minus size={16} className="text-slate-500" />
                          <span className="text-sm text-slate-600 font-medium">Stable</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Risk Breakdown */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Risk Factor Breakdown</h3>
                    
                    {/* Failed Logins */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <AlertCircle size={16} className="text-red-500" />
                          <span className="text-sm font-semibold text-slate-700">Failed Logins</span>
                          <span className="text-xs text-slate-500">({riskAnalysis.breakdown.failedLogins.weight})</span>
                        </div>
                        <div className="text-sm font-bold text-red-600">
                          {riskAnalysis.breakdown.failedLogins.score}/30 pts
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
                          style={{ width: `${(riskAnalysis.breakdown.failedLogins.score / 30) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{riskAnalysis.breakdown.failedLogins.count} failed attempts</p>
                    </div>

                    {/* Account Lockouts */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Lock size={16} className="text-orange-500" />
                          <span className="text-sm font-semibold text-slate-700">Account Lockouts</span>
                          <span className="text-xs text-slate-500">({riskAnalysis.breakdown.accountLockouts.weight})</span>
                        </div>
                        <div className="text-sm font-bold text-orange-600">
                          {riskAnalysis.breakdown.accountLockouts.score}/25 pts
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                          style={{ width: `${(riskAnalysis.breakdown.accountLockouts.score / 25) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{riskAnalysis.breakdown.accountLockouts.count} locked accounts</p>
                    </div>

                    {/* New Devices */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Users size={16} className="text-purple-500" />
                          <span className="text-sm font-semibold text-slate-700">New Devices</span>
                          <span className="text-xs text-slate-500">({riskAnalysis.breakdown.newDevices.weight})</span>
                        </div>
                        <div className="text-sm font-bold text-purple-600">
                          {riskAnalysis.breakdown.newDevices.score}/20 pts
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                          style={{ width: `${(riskAnalysis.breakdown.newDevices.score / 20) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{riskAnalysis.breakdown.newDevices.count} new devices</p>
                    </div>

                    {/* Rapid Attacks */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Activity size={16} className="text-yellow-500" />
                          <span className="text-sm font-semibold text-slate-700">Rapid Attacks</span>
                          <span className="text-xs text-slate-500">({riskAnalysis.breakdown.rapidAttacks.weight})</span>
                        </div>
                        <div className="text-sm font-bold text-yellow-600">
                          {riskAnalysis.breakdown.rapidAttacks.score}/15 pts
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-500"
                          style={{ width: `${(riskAnalysis.breakdown.rapidAttacks.score / 15) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{riskAnalysis.breakdown.rapidAttacks.maxFromSingleIP} max from single IP</p>
                    </div>

                    {/* Unreviewed Alerts */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Bell size={16} className="text-blue-500" />
                          <span className="text-sm font-semibold text-slate-700">Unreviewed Alerts</span>
                          <span className="text-xs text-slate-500">({riskAnalysis.breakdown.unreviewedAlerts.weight})</span>
                        </div>
                        <div className="text-sm font-bold text-blue-600">
                          {riskAnalysis.breakdown.unreviewedAlerts.score}/10 pts
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                          style={{ width: `${(riskAnalysis.breakdown.unreviewedAlerts.score / 10) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{riskAnalysis.breakdown.unreviewedAlerts.count} pending alerts</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                  <AlertCircle size={20} className="text-emerald-600" />
                  <span>Recommended Actions</span>
                </h3>
                <div className="space-y-3">
                  {riskAnalysis.recommendations.map((rec, index) => {
                    const priorityColor = getPriorityColor(rec.priority);
                    return (
                      <div 
                        key={index}
                        className={`flex items-start space-x-4 p-4 bg-${priorityColor}-50 border-l-4 border-${priorityColor}-500 rounded-r-lg`}
                      >
                        <div className={`p-2 bg-${priorityColor}-100 rounded-lg mt-1`}>
                          <AlertCircle size={18} className={`text-${priorityColor}-600`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`text-xs font-bold text-${priorityColor}-700 uppercase`}>
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 mb-1">{rec.action}</p>
                          <p className="text-xs text-slate-600">{rec.reason}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-20 md:hidden"></div>
      </div>
    </ContentWrapper>
  );
}
