'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import ContentWrapper from '@/components/ContentWrapper';
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
  AlertCircle
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

  return (
    <ContentWrapper>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl">
                    <Shield size={32} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Admin Dashboard
                    </h1>
                    <p className="text-slate-600 mt-1">
                      Welcome back, {user.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="hidden md:flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-xl transition-all duration-200 font-semibold"
                >
                  <RefreshCw size={18} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                <Link 
                  href="/admin" 
                  className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg"
                >
                  <span className="flex items-center space-x-2">
                    <Sparkles size={18} />
                    <span>Dashboard</span>
                  </span>
                </Link>
                <Link 
                  href="/admin/agreements" 
                  className="flex-shrink-0 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <FileSignature size={18} />
                    <span>Agreements</span>
                  </span>
                </Link>
                <Link 
                  href="/admin/properties" 
                  className="flex-shrink-0 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <Building size={18} />
                    <span>Properties</span>
                  </span>
                </Link>
                <Link 
                  href="/admin/users" 
                  className="flex-shrink-0 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <Users size={18} />
                    <span>Users</span>
                  </span>
                </Link>
                <Link 
                  href="/admin/security" 
                  className="flex-shrink-0 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <Shield size={18} />
                    <span>Security</span>
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-3xl shadow-xl border-2 border-amber-200 p-8 hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl">
                  <Filter size={28} className="text-white" />
                </div>
                <TrendingUp size={24} className="text-amber-400" />
              </div>
              <div className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-2">
                Total Pending
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {propertyStats?.pendingApproval ?? pendingApprovals.length}
              </div>
              <p className="text-sm text-slate-500 mt-2">Properties awaiting review</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border-2 border-orange-200 p-8 hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl">
                  <Clock size={28} className="text-white" />
                </div>
                <AlertCircle size={24} className="text-orange-400" />
              </div>
              <div className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-2">
                Awaiting Review
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {pendingApprovals.filter(approval => approval.status === 'PENDING').length}
              </div>
              <p className="text-sm text-slate-500 mt-2">Require immediate action</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-200 p-8 hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl">
                  <Plus size={28} className="text-white" />
                </div>
                <Sparkles size={24} className="text-emerald-400" />
              </div>
              <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-2">
                Submitted Today
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {propertyStats?.submittedToday ?? 0}
              </div>
              <p className="text-sm text-slate-500 mt-2">New submissions today</p>
            </div>
          </div>

          {/* Pending Approvals Section */}
          <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Properties Pending Approval</h2>
              <span className="px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-xl font-bold">
                {pendingApprovals.length} Pending
              </span>
            </div>

            {isLoadingApprovals ? (
              <div className="flex items-center justify-center py-32">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Home size={32} className="text-emerald-600 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-slate-600 font-medium">Loading pending approvals...</p>
                </div>
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full"></div>
                  </div>
                  <CheckCircle size={80} className="mx-auto text-emerald-400 relative z-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  All Clear!
                </h3>
                <p className="text-slate-600">
                  All properties have been reviewed. New submissions will appear here for approval.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingApprovals.map((approval) => (
                  <div 
                    key={approval.id} 
                    className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-slate-200 overflow-hidden hover:shadow-2xl hover:scale-[1.01] transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row">
                      {/* Property Image */}
                      <div className="lg:w-2/5 relative">
                        <div className="relative h-64 lg:h-full min-h-[280px]">
                          <Image
                            src={approval.property.images[0] || '/placeholder-property.jpg'}
                            alt={approval.property.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                          <div className="absolute top-4 right-4">
                            <span className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold shadow-xl animate-pulse">
                              PENDING REVIEW
                            </span>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                              <div className="text-3xl font-bold text-slate-900 mb-1">
                                {formatPrice(approval.property.price, approval.property.currencyCode)}
                              </div>
                              <div className="text-sm text-slate-500 font-medium">per month</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Property Details */}
                      <div className="flex-1 p-8">
                        <div className="flex flex-col h-full">
                          <div className="mb-4">
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">
                              {approval.property.title}
                            </h3>
                            <p className="text-slate-600 flex items-center space-x-2 mb-2">
                              <Home size={18} className="text-emerald-600" />
                              <span>{approval.property.address}, {approval.property.city}, {approval.property.state}</span>
                            </p>
                            <p className="text-sm text-slate-500 font-mono">
                              Code: {approval.property.code}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                              <div className="text-2xl font-bold text-emerald-600">{approval.property.bedrooms}</div>
                              <div className="text-xs text-slate-500 uppercase">Bedrooms</div>
                            </div>
                            <div className="bg-teal-50 rounded-xl p-3 border border-teal-200">
                              <div className="text-2xl font-bold text-teal-600">{approval.property.bathrooms}</div>
                              <div className="text-xs text-slate-500 uppercase">Bathrooms</div>
                            </div>
                            <div className="bg-cyan-50 rounded-xl p-3 border border-cyan-200">
                              <div className="text-2xl font-bold text-cyan-600">{approval.property.areaSqm}</div>
                              <div className="text-xs text-slate-500 uppercase">SQM</div>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                              <div className="text-sm font-bold text-blue-600">{approval.property.furnished ? 'Yes' : 'No'}</div>
                              <div className="text-xs text-slate-500 uppercase">Furnished</div>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-semibold text-slate-700">Owner:</span>
                                <span className="ml-2 text-slate-600">{approval.property.owner.name}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-700">Email:</span>
                                <span className="ml-2 text-slate-600">{approval.property.owner.email}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-700">Type:</span>
                                <span className="ml-2 text-slate-600">{approval.property.propertyType.name} {approval.property.propertyType.icon}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-700">Submitted:</span>
                                <span className="ml-2 text-slate-600">{formatDate(approval.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mb-6">
                            <p className="text-slate-600 line-clamp-2">
                              {approval.property.description}
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                            <Link
                              href={`/property/${approval.property.id}`}
                              className="flex items-center justify-center space-x-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold"
                            >
                              <Eye size={18} />
                              <span>View Property</span>
                            </Link>
                            <button
                              onClick={() => approveProperty(approval.property.id)}
                              disabled={approvingProperties.has(approval.property.id)}
                              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {approvingProperties.has(approval.property.id) ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                  <span>Approving...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={18} />
                                  <span>Approve</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => rejectProperty(approval.property.id)}
                              disabled={rejectingProperties.has(approval.property.id)}
                              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {rejectingProperties.has(approval.property.id) ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                  <span>Rejecting...</span>
                                </>
                              ) : (
                                <>
                                  <XCircle size={18} />
                                  <span>Reject</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-20 md:hidden"></div>
      </div>
    </ContentWrapper>
  );
}

export default AdminPage;
