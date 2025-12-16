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

interface PropertyStats {
  totalProperties: number;
  pendingApproval: number;
  createdLast7d: number;
}

interface UserStats {
  totalUsers: number;
  newUsersLast7d: number;
}

interface AgreementStats {
  totalAgreements: number;
  completed: number;
  completedLast7d: number;
}

function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PropertyApproval[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  const [approvingProperties, setApprovingProperties] = useState<Set<string>>(new Set());
  const [rejectingProperties, setRejectingProperties] = useState<Set<string>>(new Set());
  const [propertyStats, setPropertyStats] = useState<PropertyStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [agreementStats, setAgreementStats] = useState<AgreementStats | null>(null);
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
    const fetchAllStats = async () => {
      if (!user || user.role !== 'ADMIN') return;
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        // Fetch all statistics in parallel
        const [propertyRes, userRes, agreementRes] = await Promise.all([
          fetch(createApiUrl('admin/properties/statistics'), {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(createApiUrl('admin/users/statistics'), {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(createApiUrl('admin/agreements/statistics'), {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        if (propertyRes.ok) {
          const data = await propertyRes.json();
          if (data.success) {
            setPropertyStats(data.data.summary);
          }
        }

        if (userRes.ok) {
          const data = await userRes.json();
          if (data.success) {
            setUserStats(data.data.summary);
          }
        }

        if (agreementRes.ok) {
          const data = await agreementRes.json();
          if (data.success) {
            setAgreementStats(data.data.summary);
          }
        }
      } catch (err) {
        console.error('Error fetching statistics:', err);
      }
    };
    fetchAllStats();
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

  return (
    <ContentWrapper>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <AdminNav />

          {/* 3-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN - Live KPIs */}
            <div className="lg:col-span-3 space-y-6">
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-5 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Building size={24} className="opacity-80" />
                    <TrendingUp size={18} />
                  </div>
                  <div className="text-3xl font-bold">{propertyStats?.totalProperties || 0}</div>
                  <div className="text-sm opacity-90">Total Properties</div>
                  <div className="text-xs opacity-75 mt-1">+{propertyStats?.createdLast7d || 0} this week</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-xl p-5 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Users size={24} className="opacity-80" />
                    <TrendingUp size={18} />
                  </div>
                  <div className="text-3xl font-bold">{userStats?.totalUsers || 0}</div>
                  <div className="text-sm opacity-90">Total Users</div>
                  <div className="text-xs opacity-75 mt-1">+{userStats?.newUsersLast7d || 0} this week</div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl p-5 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <FileSignature size={24} className="opacity-80" />
                    <TrendingUp size={18} />
                  </div>
                  <div className="text-3xl font-bold">{agreementStats?.completed || 0}</div>
                  <div className="text-sm opacity-90">Signed Agreements</div>
                  <div className="text-xs opacity-75 mt-1">+{agreementStats?.completedLast7d || 0} this week</div>
                </div>
              </div>
            </div>

            {/* CENTER COLUMN - Approval Queue */}
            <div className="lg:col-span-6 space-y-6">
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
            </div>

            {/* RIGHT COLUMN - Quick Links */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-6">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-4">Quick Access</h3>
                <div className="space-y-3">
                  <Link href="/admin/properties" className="block">
                    <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
                      <Building size={20} className="text-emerald-600" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">Properties</p>
                        <p className="text-xs text-slate-500">{propertyStats?.totalProperties || 0} total</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/admin/users" className="block">
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                      <Users size={20} className="text-purple-600" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">Users</p>
                        <p className="text-xs text-slate-500">{userStats?.totalUsers || 0} total</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/admin/agreements" className="block">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                      <FileSignature size={20} className="text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">Agreements</p>
                        <p className="text-xs text-slate-500">{agreementStats?.totalAgreements || 0} total</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/admin/security" className="block">
                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                      <Shield size={20} className="text-red-600" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">Security</p>
                        <p className="text-xs text-slate-500">Monitor threats</p>
                      </div>
                    </div>
                  </Link>
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
