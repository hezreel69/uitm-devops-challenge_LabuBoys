'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ContentWrapper from '@/components/ContentWrapper';
import SignaturePad from '@/components/SignaturePad';
import { createApiUrl } from '@/utils/apiConfig';
import useAuthStore from '@/stores/authStore';
import useCurrentUser from '@/hooks/useCurrentUser';
import {
  FileSignature,
  ArrowLeft,
  Calendar,
  Home,
  User,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  FileText,
  XCircle,
  Shield,
  Pen,
  Sparkles
} from 'lucide-react';

interface Agreement {
  id: string;
  status: string;
  pdfUrl: string | null;
  landlordSigned: boolean;
  landlordSignedAt: string | null;
  tenantSigned: boolean;
  tenantSignedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  lease: {
    id: string;
    startDate: string;
    endDate: string;
    rentAmount: number;
    currencyCode?: string;
    property: {
      id: string;
      title: string;
      address: string;
      images?: string[];
    };
    landlord: {
      id: string;
      name: string;
      email: string;
    };
    tenant: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface AgreementData {
  agreement: Agreement;
  userRole: 'landlord' | 'tenant';
  canSign: boolean;
}

export default function AgreementSigningPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { user } = useCurrentUser();

  const [agreementData, setAgreementData] = useState<AgreementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const agreementId = params?.id as string;

  // Fetch agreement data
  const fetchAgreement = useCallback(async () => {
    if (!isLoggedIn || !agreementId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
        return;
      }

      const response = await fetch(createApiUrl(`agreements/${agreementId}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load agreement');
      }

      setAgreementData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, agreementId]);

  useEffect(() => {
    fetchAgreement();
  }, [fetchAgreement]);

  // Handle signature submission
  const handleSign = async () => {
    if (!signature || !confirmed || !agreementData) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Authentication token not found');
      return;
    }

    const endpoint = agreementData.userRole === 'landlord'
      ? `agreements/${agreementId}/sign/landlord`
      : `agreements/${agreementId}/sign/tenant`;

    try {
      setSigning(true);
      const response = await fetch(createApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          signature,
          confirmed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign agreement');
      }

      setSignSuccess(true);
      await fetchAgreement();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign');
    } finally {
      setSigning(false);
    }
  };

  // Handle agreement cancellation
  const handleCancel = async () => {
    if (!agreementData) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Authentication token not found');
      return;
    }

    try {
      setCancelling(true);
      const response = await fetch(createApiUrl(`agreements/${agreementId}/cancel`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: cancelReason || 'Cancelled by landlord',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel agreement');
      }

      await fetchAgreement();
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel agreement');
    } finally {
      setCancelling(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status color and label
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Completed', icon: <CheckCircle size={18} /> };
      case 'PENDING_LANDLORD':
        return { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Awaiting Landlord', icon: <Clock size={18} /> };
      case 'PENDING_TENANT':
        return { color: 'bg-cyan-100 text-cyan-800 border-cyan-200', label: 'Awaiting Tenant', icon: <Clock size={18} /> };
      case 'EXPIRED':
        return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Expired', icon: <AlertTriangle size={18} /> };
      case 'CANCELLED':
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Cancelled', icon: <XCircle size={18} /> };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status.replace(/_/g, ' '), icon: <FileText size={18} /> };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-teal-300 border-t-transparent rounded-full animate-spin-slow opacity-30 mx-auto"></div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-emerald-900 mb-2">Loading Agreement</h3>
            <p className="text-emerald-700">Please wait while we fetch your agreement details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={40} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Oops! Something Went Wrong</h2>
            <p className="text-gray-600 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!agreementData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center space-y-6">
          <FileSignature size={80} className="mx-auto text-gray-300" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Agreement Not Found</h2>
            <p className="text-gray-600">This agreement may have been deleted or you don&apos;t have access to view it.</p>
          </div>
          <button
            onClick={() => router.push('/my-agreements')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg"
          >
            View My Agreements
          </button>
        </div>
      </div>
    );
  }

  const { agreement, userRole, canSign } = agreementData;
  const statusConfig = getStatusConfig(agreement.status);
  const propertyImage = agreement.lease.property.images?.[0] || '/placeholder-property.jpg';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8">
      <ContentWrapper>
        {/* Header */}
        <div className="max-w-5xl mx-auto mb-8 px-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <Link
                  href="/my-agreements"
                  className="p-2 sm:p-3 hover:bg-emerald-50 rounded-xl transition-colors group"
                >
                  <ArrowLeft size={20} className="text-emerald-600 group-hover:text-emerald-700 sm:w-6 sm:h-6" />
                </Link>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <FileSignature size={24} className="text-white sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Rental Agreement</h1>
                    <p className="text-emerald-600 font-medium text-xs sm:text-sm lg:text-base">Digital Signature Required</p>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full text-sm sm:text-base font-semibold flex items-center gap-2 border-2 ${statusConfig.color}`}>
                {statusConfig.icon}
                <span>{statusConfig.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Property Header with modern gradient */}
            <div className="relative h-48 sm:h-64 lg:h-72">
              <Image
                src={propertyImage}
                alt={agreement.lease.property.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-white text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                      <Home size={14} className="sm:w-4 sm:h-4" />
                      Property Details
                    </div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3">{agreement.lease.property.title}</h2>
                    <div className="flex items-center text-white/95">
                      <MapPin size={16} className="mr-2 sm:w-[18px] sm:h-[18px]" />
                      <span className="text-sm sm:text-base lg:text-lg">{agreement.lease.property.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agreement Details */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
              {/* Lease Summary Cards */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-emerald-600 sm:w-6 sm:h-6" />
                  Lease Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 sm:p-6 border-2 border-emerald-100">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
                        <Calendar size={24} className="text-emerald-600 sm:w-7 sm:h-7" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-emerald-700 mb-1">Lease Period</p>
                        <p className="text-base sm:text-lg font-bold text-gray-900">
                          {formatDate(agreement.lease.startDate)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">to {formatDate(agreement.lease.endDate)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-4 sm:p-6 border-2 border-teal-100">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
                        <Home size={24} className="text-teal-600 sm:w-7 sm:h-7" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-teal-700 mb-1">Monthly Rent</p>
                        <p className="text-2xl sm:text-3xl font-bold text-teal-600">
                          RM {Number(agreement.lease.rentAmount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signing Parties - Modern Design */}
              <div className="border-t-2 border-gray-100 pt-6 sm:pt-8">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                  <User size={20} className="text-emerald-600 sm:w-6 sm:h-6" />
                  Signing Parties
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {/* Landlord Card */}
                  <div className={`relative overflow-hidden rounded-2xl border-2 transition-all ${
                    agreement.landlordSigned
                      ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-emerald-200 hover:shadow-md'
                  }`}>
                    {agreement.landlordSigned && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-0.5 sm:px-4 sm:py-1 rounded-bl-2xl font-semibold text-xs sm:text-sm flex items-center gap-1">
                        <CheckCircle size={12} className="sm:w-[14px] sm:h-[14px]" />
                        Signed
                      </div>
                    )}
                    <div className="flex items-center justify-between p-4 sm:p-6 gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white text-lg sm:text-2xl font-bold shadow-lg flex-shrink-0 ${
                          agreement.landlordSigned ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {agreement.lease.landlord.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full mb-1 sm:mb-2">
                            LANDLORD
                          </div>
                          <p className="text-base sm:text-lg font-bold text-gray-900 truncate">{agreement.lease.landlord.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{agreement.lease.landlord.email}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {agreement.landlordSigned ? (
                          <div className="space-y-0.5 sm:space-y-1">
                            <div className="text-xs sm:text-sm font-semibold text-emerald-700">Signed</div>
                            {agreement.landlordSignedAt && (
                              <p className="text-[10px] sm:text-xs text-gray-500">{formatDateTime(agreement.landlordSignedAt)}</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 bg-amber-100 text-amber-700 font-semibold rounded-full text-xs sm:text-sm">
                            <Clock size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Awaiting</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tenant Card */}
                  <div className={`relative overflow-hidden rounded-2xl border-2 transition-all ${
                    agreement.tenantSigned
                      ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-emerald-200 hover:shadow-md'
                  }`}>
                    {agreement.tenantSigned && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-0.5 sm:px-4 sm:py-1 rounded-bl-2xl font-semibold text-xs sm:text-sm flex items-center gap-1">
                        <CheckCircle size={12} className="sm:w-[14px] sm:h-[14px]" />
                        Signed
                      </div>
                    )}
                    <div className="flex items-center justify-between p-4 sm:p-6 gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white text-lg sm:text-2xl font-bold shadow-lg flex-shrink-0 ${
                          agreement.tenantSigned ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {agreement.lease.tenant.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 bg-cyan-100 text-cyan-700 text-xs font-bold rounded-full mb-1 sm:mb-2">
                            TENANT
                          </div>
                          <p className="text-base sm:text-lg font-bold text-gray-900 truncate">{agreement.lease.tenant.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{agreement.lease.tenant.email}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {agreement.tenantSigned ? (
                          <div className="space-y-0.5 sm:space-y-1">
                            <div className="text-xs sm:text-sm font-semibold text-emerald-700">Signed</div>
                            {agreement.tenantSignedAt && (
                              <p className="text-[10px] sm:text-xs text-gray-500">{formatDateTime(agreement.tenantSignedAt)}</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 bg-amber-100 text-amber-700 font-semibold rounded-full text-xs sm:text-sm">
                            <Clock size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">{agreement.landlordSigned ? 'Awaiting' : 'Waiting'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Download - Modern Style */}
              {agreement.pdfUrl && (
                <div className="border-t-2 border-gray-100 pt-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText size={24} className="text-emerald-600" />
                    Agreement Document
                  </h3>
                  <a
                    href={agreement.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-2xl border-2 border-emerald-200 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
                        <FileText size={28} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">Rental Agreement PDF</p>
                        <p className="text-sm text-emerald-700">Click to download full agreement</p>
                      </div>
                    </div>
                    <Download size={24} className="text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                  </a>
                </div>
              )}

              {/* Signature Section - Enhanced */}
              {canSign && !signSuccess && (
                <div className="border-t-2 border-gray-100 pt-6 sm:pt-8">
                  <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-4 sm:p-6 lg:p-8 border-2 border-emerald-200">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                        <Pen size={20} className="text-white sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Your Digital Signature</h3>
                        <p className="text-emerald-700 text-sm sm:text-base">
                          Signing as <span className="font-bold">{userRole === 'landlord' ? 'Landlord' : 'Tenant'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 border-2 border-gray-200 shadow-inner overflow-x-auto">
                      <SignaturePad
                        onSignatureChange={setSignature}
                        width={Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 80 : 600)}
                        height={200}
                      />
                    </div>

                    <label className="flex items-start gap-3 sm:gap-4 mb-6 sm:mb-8 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="w-5 h-5 sm:w-6 sm:h-6 mt-0.5 sm:mt-1 rounded-lg border-2 border-emerald-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer flex-shrink-0"
                      />
                      <span className="text-gray-700 leading-relaxed flex-1 text-sm sm:text-base">
                        <span className="font-semibold text-gray-900">I confirm that:</span>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-xs sm:text-sm">
                          <li>I have read and agree to all terms and conditions in this rental agreement</li>
                          <li>I understand that this digital signature is legally binding</li>
                          <li>The information provided is accurate and complete</li>
                        </ul>
                      </span>
                    </label>

                    <button
                      onClick={handleSign}
                      disabled={!signature || !confirmed || signing}
                      className="w-full py-4 sm:py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-base sm:text-lg font-bold rounded-2xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:hover:scale-100"
                    >
                      {signing ? (
                        <span className="flex items-center justify-center gap-2 sm:gap-3">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing Signature...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2 sm:gap-3">
                          <FileSignature size={20} className="sm:w-6 sm:h-6" />
                          Sign Agreement as {userRole === 'landlord' ? 'Landlord' : 'Tenant'}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Success Message - Celebration Design */}
              {signSuccess && (
                <div className="border-t-2 border-gray-100 pt-8">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-10 text-center border-2 border-emerald-200">
                    <div className="relative inline-block mb-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
                        <CheckCircle size={48} className="text-white" strokeWidth={3} />
                      </div>
                      <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                    </div>
                    <h3 className="text-3xl font-bold text-emerald-900 mb-3">Signature Submitted Successfully!</h3>
                    <p className="text-lg text-emerald-700 max-w-md mx-auto">
                      {agreement.status === 'COMPLETED'
                        ? '🎉 Both parties have signed. The agreement is now complete and legally binding!'
                        : 'Your signature has been securely recorded. Waiting for the other party to sign.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Completed Message */}
              {agreement.status === 'COMPLETED' && !canSign && !signSuccess && (
                <div className="border-t-2 border-gray-100 pt-8">
                  <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-10 text-center border-2 border-emerald-200">
                    <div className="text-6xl mb-4 animate-bounce-slow">🎊</div>
                    <h3 className="text-3xl font-bold text-emerald-900 mb-3">Agreement Completed!</h3>
                    <p className="text-lg text-emerald-700">
                      This agreement was completed on {agreement.completedAt && formatDateTime(agreement.completedAt)}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-6 px-6 py-3 bg-white rounded-full inline-flex">
                      <Shield size={20} className="text-emerald-600" />
                      <span className="font-semibold text-emerald-800">Legally Binding Document</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Expiry Warning */}
              {agreement.expiresAt && agreement.status !== 'COMPLETED' && (
                <div className="border-t-2 border-gray-100 pt-8">
                  <div className="flex items-center gap-4 p-5 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={24} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-900 mb-1">Time-Sensitive Agreement</p>
                      <p className="text-sm text-amber-700">
                        This agreement must be signed by all parties before <span className="font-bold">{formatDateTime(agreement.expiresAt)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancel Agreement */}
              {userRole === 'landlord' && agreement.status !== 'COMPLETED' && agreement.status !== 'CANCELLED' && (
                <div className="border-t-2 border-gray-100 pt-6 sm:pt-8">
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <XCircle size={20} className="text-red-600 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <h4 className="text-base sm:text-lg font-bold text-red-900 mb-1">Cancel Agreement</h4>
                          <p className="text-xs sm:text-sm text-red-700">This action is permanent and cannot be undone. The agreement will be marked as cancelled.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
                      >
                        <XCircle size={18} className="sm:w-5 sm:h-5" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancelled Status */}
              {agreement.status === 'CANCELLED' && (
                <div className="border-t-2 border-gray-100 pt-8">
                  <div className="bg-gray-50 rounded-3xl p-10 text-center border-2 border-gray-200">
                    <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-6">
                      <XCircle size={40} className="text-gray-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Agreement Cancelled</h3>
                    <p className="text-gray-600">
                      This agreement has been cancelled and is no longer valid.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cancel Modal - Modern Design */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-slide-up">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle size={40} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Cancel Agreement?
                  </h3>
                  <p className="text-gray-600">
                    This action is permanent. The agreement will be cancelled and marked as invalid.
                  </p>
                </div>

                <div className="text-left">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Reason for cancellation (optional)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Provide a reason for cancelling this agreement..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelReason('');
                    }}
                    disabled={cancelling}
                    className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                  >
                    Keep Agreement
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 px-6 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {cancelling ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle size={20} />
                        Confirm Cancellation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ContentWrapper>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
