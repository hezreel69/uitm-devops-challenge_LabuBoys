'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ContentWrapper from '@/components/ContentWrapper';
import {
  FileSignature,
  Calendar,
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  Key,
  TrendingUp,
  DollarSign,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import useAuthStore from '@/stores/authStore';
import useCurrentUser from '@/hooks/useCurrentUser';
import { createApiUrl } from '@/utils/apiConfig';

interface Agreement {
  id: string;
  leaseId: string;
  pdfUrl: string | null;
  status: string;
  landlordSigned: boolean;
  landlordSignedAt: string | null;
  tenantSigned: boolean;
  tenantSignedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  generatedAt: string;
  lease: {
    id: string;
    startDate: string;
    endDate: string;
    rentAmount: string;
    currencyCode: string;
    property: {
      id: string;
      title: string;
      address: string;
      city: string;
      images: string[];
    };
    tenant: {
      id: string;
      name: string;
      email: string;
    };
    landlord: {
      id: string;
      name: string;
      email: string;
    };
  };
}

type RoleFilter = 'all' | 'landlord' | 'tenant';

function MyAgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const { isLoggedIn } = useAuthStore();
  const { user } = useCurrentUser();

  useEffect(() => {
    const fetchAgreements = async () => {
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

        const response = await fetch(createApiUrl('agreements/my-agreements'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setAgreements([]);
            setIsLoading(false);
            return;
          }
          throw new Error(`Failed to fetch agreements: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setAgreements(data.data);
        } else {
          setError('Failed to load agreements');
        }
      } catch (err) {
        console.error('Error fetching agreements:', err);
        setError(err instanceof Error ? err.message : 'Failed to load agreements');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgreements();
  }, [isLoggedIn]);

  const getUserRole = (agreement: Agreement): 'landlord' | 'tenant' => {
    return agreement.lease.landlord.id === user?.id ? 'landlord' : 'tenant';
  };

  const filteredAgreements = agreements.filter(agreement => {
    if (roleFilter === 'all') return true;
    return getUserRole(agreement) === roleFilter;
  });

  const landlordCount = agreements.filter(a => getUserRole(a) === 'landlord').length;
  const tenantCount = agreements.filter(a => getUserRole(a) === 'tenant').length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DRAFT':
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          icon: <AlertCircle size={16} className="text-slate-600" />,
          label: 'Draft'
        };
      case 'PENDING_LANDLORD':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-800',
          icon: <Clock size={16} className="text-amber-600" />,
          label: 'Awaiting Landlord'
        };
      case 'PENDING_TENANT':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: <Clock size={16} className="text-blue-600" />,
          label: 'Awaiting Tenant'
        };
      case 'COMPLETED':
        return {
          bg: 'bg-emerald-100',
          text: 'text-emerald-800',
          icon: <CheckCircle size={16} className="text-emerald-600" />,
          label: 'Completed'
        };
      case 'EXPIRED':
      case 'CANCELLED':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: <XCircle size={16} className="text-red-600" />,
          label: status === 'EXPIRED' ? 'Expired' : 'Cancelled'
        };
      default:
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          icon: <AlertCircle size={16} className="text-slate-600" />,
          label: status
        };
    }
  };

  const needsToSign = (agreement: Agreement): boolean => {
    const role = getUserRole(agreement);
    if (role === 'landlord') {
      return !agreement.landlordSigned && (agreement.status === 'DRAFT' || agreement.status === 'PENDING_LANDLORD');
    } else {
      return !agreement.tenantSigned && agreement.status === 'PENDING_TENANT';
    }
  };

  if (!isLoggedIn) {
    return (
      <ContentWrapper>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
          <div className="text-center space-y-8 max-w-md">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
              </div>
              <FileSignature size={80} className="mx-auto text-emerald-600 relative z-10" />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Please Log In
              </h3>
              <p className="text-slate-600">
                Sign in to view and manage your rental agreements
              </p>
            </div>
            <Link
              href="/auth"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
            >
              <span>Log In to Continue</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </ContentWrapper>
    );
  }

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
                    <FileSignature size={32} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      My Agreements
                    </h1>
                    <p className="text-slate-600 mt-1">
                      Manage and sign your rental agreements
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600">{agreements.length}</div>
                    <div className="text-sm text-slate-500">Total</div>
                  </div>
                  <div className="h-12 w-px bg-slate-200"></div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-teal-600">
                      {agreements.filter(a => a.status === 'COMPLETED').length}
                    </div>
                    <div className="text-sm text-slate-500">Completed</div>
                  </div>
                </div>
              </div>

              {/* Role Filter Tabs */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    roleFilter === 'all'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <Sparkles size={18} />
                    <span>All ({agreements.length})</span>
                  </span>
                </button>
                <button
                  onClick={() => setRoleFilter('landlord')}
                  className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    roleFilter === 'landlord'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <Home size={18} />
                    <span>Landlord ({landlordCount})</span>
                  </span>
                </button>
                <button
                  onClick={() => setRoleFilter('tenant')}
                  className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    roleFilter === 'tenant'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <Key size={18} />
                    <span>Tenant ({tenantCount})</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="animate-spin rounded-full h-20 w-20 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin-slow">
                      <FileSignature size={32} className="text-emerald-600" />
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 font-medium">Loading your agreements...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-3xl shadow-xl border-2 border-red-200 p-12 text-center">
              <XCircle size={64} className="mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Error Loading Agreements</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold"
              >
                Try Again
              </button>
            </div>
          ) : filteredAgreements.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-12 text-center">
              <div className="max-w-md mx-auto space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full"></div>
                  </div>
                  <FileSignature size={80} className="mx-auto text-emerald-400 relative z-10" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {roleFilter === 'all'
                      ? 'No Agreements Yet'
                      : roleFilter === 'landlord'
                      ? 'No Landlord Agreements'
                      : 'No Tenant Agreements'}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {roleFilter === 'landlord'
                      ? 'When tenants book your properties, agreements will appear here.'
                      : roleFilter === 'tenant'
                      ? 'When you book properties, agreements will appear here.'
                      : 'Agreements will appear here when you book or receive bookings.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredAgreements.map((agreement) => {
                const userRole = getUserRole(agreement);
                const actionNeeded = needsToSign(agreement);
                const statusConfig = getStatusConfig(agreement.status);

                return (
                  <div
                    key={agreement.id}
                    className={`bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] ${
                      actionNeeded
                        ? 'border-4 border-amber-400 ring-4 ring-amber-200 animate-pulse-slow'
                        : 'border-2 border-emerald-100'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row">
                      {/* Property Image */}
                      <div className="lg:w-2/5 relative">
                        <div className="relative h-64 lg:h-full min-h-[280px]">
                          <Image
                            src={agreement.lease.property.images?.[0] || '/placeholder-property.jpg'}
                            alt={agreement.lease.property.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                          {/* Role Badge */}
                          <div
                            className={`absolute top-4 left-4 px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shadow-xl backdrop-blur-sm ${
                              userRole === 'landlord'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                            }`}
                          >
                            {userRole === 'landlord' ? <Home size={18} /> : <Key size={18} />}
                            <span>{userRole === 'landlord' ? 'My Property' : 'My Rental'}</span>
                          </div>

                          {/* Action Needed Badge */}
                          {actionNeeded && (
                            <div className="absolute top-4 right-4 px-4 py-2 bg-amber-500 text-white rounded-xl font-bold animate-bounce shadow-xl">
                              <span className="flex items-center space-x-2">
                                <AlertCircle size={18} />
                                <span>Signature Required</span>
                              </span>
                            </div>
                          )}

                          {/* Rent Amount */}
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <DollarSign size={20} className="text-emerald-600" />
                                  <span className="text-2xl font-bold text-slate-900">
                                    {agreement.lease.currencyCode} {parseFloat(agreement.lease.rentAmount).toLocaleString()}
                                  </span>
                                </div>
                                <span className="text-sm text-slate-500 font-medium">per month</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Agreement Details */}
                      <div className="flex-1 p-8">
                        <div className="flex flex-col h-full">
                          {/* Header */}
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                {agreement.lease.property.title}
                              </h3>
                              <div className="flex items-center text-slate-600 mb-3">
                                <MapPin size={18} className="mr-2 text-emerald-600" />
                                <span className="font-medium">{agreement.lease.property.address}, {agreement.lease.property.city}</span>
                              </div>
                            </div>
                            <div className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-2 ${statusConfig.bg} ${statusConfig.text}`}>
                              {statusConfig.icon}
                              <span>{statusConfig.label}</span>
                            </div>
                          </div>

                          {/* Info Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Lease Period */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border-2 border-emerald-200">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-white rounded-xl">
                                  <Calendar size={20} className="text-emerald-600" />
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500 font-semibold uppercase">Lease Period</div>
                                  <div className="text-sm font-bold text-slate-900">
                                    {formatDate(agreement.lease.startDate)} - {formatDate(agreement.lease.endDate)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Other Party */}
                            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-4 border-2 border-cyan-200">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-white rounded-xl">
                                  <User size={20} className="text-cyan-600" />
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500 font-semibold uppercase">
                                    {userRole === 'landlord' ? 'Tenant' : 'Landlord'}
                                  </div>
                                  <div className="text-sm font-bold text-slate-900">
                                    {userRole === 'landlord' ? agreement.lease.tenant.name : agreement.lease.landlord.name}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Signature Status */}
                          <div className="bg-slate-50 rounded-2xl p-6 mb-6 border-2 border-slate-200">
                            <div className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Signature Status</div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-xl ${agreement.landlordSigned ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                                    {agreement.landlordSigned ? (
                                      <CheckCircle size={20} className="text-emerald-600" />
                                    ) : (
                                      <Clock size={20} className="text-slate-500" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900">Landlord Signature</div>
                                    {userRole === 'landlord' && !agreement.landlordSigned && (
                                      <div className="text-xs text-amber-600 font-bold">Your signature required</div>
                                    )}
                                  </div>
                                </div>
                                <div className={`px-3 py-1 rounded-lg font-bold text-sm ${agreement.landlordSigned ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                  {agreement.landlordSigned ? 'Signed' : 'Pending'}
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-xl ${agreement.tenantSigned ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                                    {agreement.tenantSigned ? (
                                      <CheckCircle size={20} className="text-emerald-600" />
                                    ) : (
                                      <Clock size={20} className="text-slate-500" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900">Tenant Signature</div>
                                    {userRole === 'tenant' && !agreement.tenantSigned && (
                                      <div className="text-xs text-amber-600 font-bold">Your signature required</div>
                                    )}
                                  </div>
                                </div>
                                <div className={`px-3 py-1 rounded-lg font-bold text-sm ${agreement.tenantSigned ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                  {agreement.tenantSigned ? 'Signed' : 'Pending'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-auto space-y-4 sm:space-y-0">
                            <div className="flex items-center space-x-2 text-sm text-slate-500">
                              <Clock size={16} />
                              <span>Created {formatDate(agreement.generatedAt)}</span>
                            </div>
                            <Link
                              href={`/agreements/${agreement.leaseId}`}
                              className={`inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl font-bold transition-all duration-200 ${
                                actionNeeded
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-xl hover:scale-105 animate-pulse'
                                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl hover:scale-105'
                              }`}
                            >
                              <FileSignature size={20} />
                              <span>{actionNeeded ? 'Sign Agreement Now' : 'View Agreement'}</span>
                              <ArrowRight size={20} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-20 md:hidden"></div>
      </div>
    </ContentWrapper>
  );
}

export default MyAgreementsPage;
