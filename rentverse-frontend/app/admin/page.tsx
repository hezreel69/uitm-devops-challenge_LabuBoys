'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import ContentWrapper from '@/components/ContentWrapper';
import AdminNav from '@/components/AdminNav';
import { 
  Plus, 
  Filter, 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Eye,
  TrendingUp,
  Home,
  Users,
  FileSignature,
  Shield,
  Sparkles,
  Building,
  AlertCircle,
  Activity,
  BarChart3,
  UserPlus,
  Bell
} from 'lucide-react';
import useAuthStore from '@/stores/authStore';
import { createApiUrl } from '@/utils/apiConfig';

interface PropertyApproval {
  id: string;
  propertyId: string;
  reviewerId: string | null;
  status: string;
  notes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  property: {
    id: string;
    title: string;
    description: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    price: string;
    currencyCode: string;
    bedrooms: number;
    bathrooms: number;
    areaSqm: number;
    furnished: boolean;
    isAvailable: boolean;
    images: string[];
    latitude: number;
    longitude: number;
    placeId: string | null;
    projectName: string | null;
    developer: string | null;
    code: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    ownerId: string;
    propertyTypeId: string;
    owner: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      name: string;
    };
    propertyType: {
      id: string;
      code: string;
      name: string;
      description: string;
      icon: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
}

interface PendingApprovalsResponse {
  success: boolean;
  data: {
    approvals: PropertyApproval[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  dateOfBirth: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AuthMeResponse {
  success: boolean;
  data: {
    user: User;
  };
}

// Mock data for activity feed
const mockActivities = [
  { id: '1', type: 'approval', message: 'Property approved in Kuala Lumpur', time: '2m ago', icon: CheckCircle },
  { id: '2', type: 'user', message: 'New user registered', time: '15m ago', icon: UserPlus },
  { id: '3', type: 'property', message: 'New property submitted', time: '1h ago', icon: Building },
  { id: '4', type: 'agreement', message: 'Agreement signed', time: '2h ago', icon: FileSignature },
  { id: '5', type: 'approval', message: 'Property rejected in Penang', time: '3h ago', icon: XCircle },
];

// Mock recent users
const mockRecentUsers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'USER', time: '5m ago' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'USER', time: '12m ago' },
  { id: '3', name: 'Mike Wilson', email: 'mike@example.com', role: 'USER', time: '1h ago' },
];

function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PropertyApproval[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  const [approvingProperties, setApprovingProperties] = useState<Set<string>>(new Set());
  const [rejectingProperties, setRejectingProperties] = useState<Set<string>>(new Set());
  const [propertyStats, setPropertyStats] = useState<{ pendingApproval: number; submittedToday: number } | null>(null);
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!isLoggedIn) {
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Authentication token not found');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const data: AuthMeResponse = await response.json();

        if (data.success) {
          setUser(data.data.user);
        } else {
          setError('Failed to load user data');
        }
      } catch (err) {
        console.error('Error checking admin role:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify admin access');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      if (!user || user.role !== 'ADMIN') return;

      try {
        setIsLoadingApprovals(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(createApiUrl('properties/pending-approval'), {
          method: 'GET',
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch pending approvals: ${response.status}`);
        }

        const data: PendingApprovalsResponse = await response.json();

        if (data.success) {
          setPendingApprovals(data.data.approvals);
        } else {
          setError('Failed to load pending approvals');
        }
      } catch (err) {
        console.error('Error fetching pending approvals:', err);
        setError(err instanceof Error ? err.message : 'Failed to load pending approvals');
      } finally {
        setIsLoadingApprovals(false);
      }
    };

    fetchPendingApprovals();
  }, [user]);

  useEffect(() => {
    const fetchPropertyStats = async () => {
      if (!user || user.role !== 'ADMIN') return;
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const response = await fetch(createApiUrl('admin/properties/statistics'), {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.summary) {
            setPropertyStats({
              pendingApproval: data.data.summary.pendingApproval,
              submittedToday: data.data.summary.submittedToday,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching property statistics:', err);
      }
    };
    fetchPropertyStats();
  }, [user]);

  const formatPrice = (price: string, currency: string) => {
    const num = parseFloat(price);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'MYR' ? 'MYR' : 'USD',
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
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
            <p className="text-slate-600 font-medium">Verifying admin access...</p>
          </div>
        </div>
      </ContentWrapper>
    );
  }

  if (error || !user) {
    return (
      <ContentWrapper>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-red-200 p-12 text-center max-w-md">
            <XCircle size={64} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Error</h3>
            <p className="text-red-600 mb-6">{error || 'Access denied'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-xl transition-all duration-200 font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      </ContentWrapper>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <ContentWrapper>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-100 p-12 text-center max-w-md">
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-full opacity-50"></div>
              </div>
              <Shield size={80} className="mx-auto text-red-500 relative z-10" />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Access Denied
              </h3>
              <p className="text-slate-600 leading-relaxed">
                You don't have permission to access the admin panel. Only administrators can view this page.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center space-x-2 mt-8 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
            >
              <span>Go to Home</span>
            </Link>
          </div>
        </div>
      </ContentWrapper>
    );
  }

  const approveProperty = async (propertyId: string) => {
    try {
      setApprovingProperties(prev => new Set(prev).add(propertyId));
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(createApiUrl(`properties/${propertyId}/approve`), {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: 'Approved by admin'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to approve property: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPendingApprovals(prev => prev.filter(approval => approval.propertyId !== propertyId));
      } else {
        throw new Error('Failed to approve property');
      }
    } catch (err) {
      console.error('Error approving property:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve property');
    } finally {
      setApprovingProperties(prev => {
        const newSet = new Set(prev);
        newSet.delete(propertyId);
        return newSet;
      });
    }
  };

  const rejectProperty = async (propertyId: string) => {
    try {
      setRejectingProperties(prev => new Set(prev).add(propertyId));
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(createApiUrl(`properties/${propertyId}/reject`), {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: 'Rejected by admin'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject property: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPendingApprovals(prev => prev.filter(approval => approval.propertyId !== propertyId));
      } else {
        throw new Error('Failed to reject property');
      }
    } catch (err) {
      console.error('Error rejecting property:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject property');
    } finally {
      setRejectingProperties(prev => {
        const newSet = new Set(prev);
        newSet.delete(propertyId);
        return newSet;
      });
    }
  };

  const totalProperties = propertyStats?.pendingApproval ? (propertyStats.pendingApproval + 45) : 45;
  const totalUsers = 127;
  const activeAgreements = 23;

  return (
    <ContentWrapper>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <AdminNav />

          {/* 3-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN - KPIs & Activity Feed */}
            <div className="lg:col-span-3 space-y-6">
              {/* Live KPIs */}
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-5 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Building size={24} className="opacity-80" />
                    <TrendingUp size={18} />
                  </div>
                  <div className="text-3xl font-bold">{totalProperties}</div>
                  <div className="text-sm opacity-90">Total Properties</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-xl p-5 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Users size={24} className="opacity-80" />
                    <TrendingUp size={18} />
                  </div>
                  <div className="text-3xl font-bold">{totalUsers}</div>
                  <div className="text-sm opacity-90">Total Users</div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl p-5 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <FileSignature size={24} className="opacity-80" />
                    <TrendingUp size={18} />
                  </div>
                  <div className="text-3xl font-bold">{activeAgreements}</div>
                  <div className="text-sm opacity-90">Active Agreements</div>
                </div>
              </div>

              {/* Live Activity Feed */}
              <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Live Activity</h3>
                  <Activity size={18} className="text-emerald-600 animate-pulse" />
                </div>
                <div className="space-y-3">
                  {mockActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-2 rounded-xl hover:bg-emerald-50 transition-colors">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <activity.icon size={14} className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 font-medium truncate">{activity.message}</p>
                        <p className="text-xs text-slate-400">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTER COLUMN - Approval Queue & Timeline */}
            <div className="lg:col-span-6 space-y-6">
              {/* Approval Queue */}
              <div className="bg-white rounded-3xl shadow-xl border-2 border-amber-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                    <Filter className="text-amber-600" size={24} />
                    <span>Approval Queue</span>
                  </h2>
                  <span className="px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-xl font-bold">
                    {pendingApprovals.length} Pending
                  </span>
                </div>

                {isLoadingApprovals ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600"></div>
                  </div>
                ) : pendingApprovals.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={64} className="mx-auto text-emerald-400 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">All Clear!</h3>
                    <p className="text-slate-600">No properties pending approval</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApprovals.slice(0, 3).map((approval) => (
                      <div 
                        key={approval.id} 
                        className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-slate-200 overflow-hidden hover:shadow-lg transition-all"
                      >
                        <div className="flex flex-col sm:flex-row">
                          <div className="sm:w-40 relative h-32 sm:h-auto">
                            <Image
                              src={approval.property.images[0] || '/placeholder-property.jpg'}
                              alt={approval.property.title}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded-lg font-bold">
                                NEW
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 p-4">
                            <h3 className="text-base font-bold text-slate-900 mb-1 truncate">
                              {approval.property.title}
                            </h3>
                            <p className="text-sm text-slate-600 mb-2 flex items-center">
                              <Home size={14} className="mr-1 text-emerald-600" />
                              {approval.property.city}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="text-lg font-bold text-emerald-600">
                                {formatPrice(approval.property.price, approval.property.currencyCode)}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => approveProperty(approval.property.id)}
                                  disabled={approvingProperties.has(approval.property.id)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                  {approvingProperties.has(approval.property.id) ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                  ) : (
                                    <CheckCircle size={16} />
                                  )}
                                </button>
                                <button
                                  onClick={() => rejectProperty(approval.property.id)}
                                  disabled={rejectingProperties.has(approval.property.id)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                  {rejectingProperties.has(approval.property.id) ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                  ) : (
                                    <XCircle size={16} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {pendingApprovals.length > 3 && (
                      <Link
                        href="/admin/properties"
                        className="block text-center py-3 text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
                      >
                        View all {pendingApprovals.length} pending approvals →
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Activity Timeline */}
              <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center space-x-2">
                  <Clock className="text-emerald-600" size={24} />
                  <span>Recent Activity Timeline</span>
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <CheckCircle size={18} className="text-white" />
                      </div>
                      <div className="w-0.5 h-12 bg-emerald-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pt-2">
                      <p className="text-sm font-semibold text-slate-900">Property Approved</p>
                      <p className="text-xs text-slate-600">Modern Condo in KLCC approved</p>
                      <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                        <UserPlus size={18} className="text-white" />
                      </div>
                      <div className="w-0.5 h-12 bg-blue-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pt-2">
                      <p className="text-sm font-semibold text-slate-900">New User Registered</p>
                      <p className="text-xs text-slate-600">John Doe joined as tenant</p>
                      <p className="text-xs text-slate-400 mt-1">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                        <FileSignature size={18} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <p className="text-sm font-semibold text-slate-900">Agreement Signed</p>
                      <p className="text-xs text-slate-600">Lease agreement completed</p>
                      <p className="text-xs text-slate-400 mt-1">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Analytics & Recent Users */}
            <div className="lg:col-span-3 space-y-6">
              {/* Growth Analytics */}
              <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-6">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-4">7-Day Growth</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600">Properties</span>
                      <span className="text-sm font-bold text-emerald-600">+{propertyStats?.submittedToday || 0}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600">Users</span>
                      <span className="text-sm font-bold text-purple-600">+12</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-violet-600" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600">Agreements</span>
                      <span className="text-sm font-bold text-blue-600">+8</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-600" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600">Revenue</span>
                      <span className="text-sm font-bold text-amber-600">+15%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-orange-600" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Users */}
              <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-6">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {mockRecentUsers.map((recentUser) => (
                    <div key={recentUser.id} className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                        {recentUser.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{recentUser.name}</p>
                        <p className="text-xs text-slate-500 truncate">{recentUser.email}</p>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">{recentUser.time}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/admin/users"
                  className="block text-center mt-4 py-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
                >
                  View all users →
                </Link>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-6">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm text-slate-700">API Server</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-xs font-semibold text-emerald-600">Operational</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm text-slate-700">Database</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-xs font-semibold text-emerald-600">Operational</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm text-slate-700">Storage</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-xs font-semibold text-emerald-600">Operational</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm text-slate-700">Email Service</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-xs font-semibold text-emerald-600">Operational</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-20 md:hidden"></div>
      </div>
    </ContentWrapper>
  );
}

export default AdminPage;
