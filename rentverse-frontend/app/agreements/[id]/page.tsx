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
  XCircle
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
      // Refresh agreement data
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

      // Refresh agreement data
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
        return { color: 'bg-green-100 text-green-800', label: 'Completed', icon: <CheckCircle size={16} /> };
      case 'PENDING_LANDLORD':
        return { color: 'bg-amber-100 text-amber-800', label: 'Awaiting Landlord', icon: <Clock size={16} /> };
      case 'PENDING_TENANT':
        return { color: 'bg-blue-100 text-blue-800', label: 'Awaiting Tenant', icon: <Clock size={16} /> };
      case 'EXPIRED':
        return { color: 'bg-red-100 text-red-800', label: 'Expired', icon: <AlertTriangle size={16} /> };
      case 'CANCELLED':
        return { color: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: <AlertTriangle size={16} /> };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status.replace(/_/g, ' '), icon: <FileText size={16} /> };
    }
  };

  if (loading) {
    return (
      <ContentWrapper>
        <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-slate-600">Loading agreement...</p>
          </div>
        </div>
      </ContentWrapper>
    );
  }

  if (error) {
    return (
      <ContentWrapper>
        <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Error</h2>
              <p className="text-slate-600">{error}</p>
            </div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </ContentWrapper>
    );
  }

  if (!agreementData) {
    return (
      <ContentWrapper>
        <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
          <div className="text-center space-y-6">
            <FileSignature size={64} className="mx-auto text-slate-300" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Agreement Not Found</h2>
              <p className="text-slate-600">This agreement may have been deleted or you don&apos;t have access.</p>
            </div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </ContentWrapper>
    );
  }

  const { agreement, userRole, canSign } = agreementData;
  const statusConfig = getStatusConfig(agreement.status);
  const propertyImage = agreement.lease.property.images?.[0] || '/placeholder-property.jpg';

  return (
    <ContentWrapper>
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/my-agreements"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div className="flex items-center space-x-3">
              <FileSignature size={28} className="text-indigo-600" />
              <h1 className="text-2xl font-serif text-slate-900">Digital Agreement</h1>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${statusConfig.color}`}>
            {statusConfig.icon}
            <span>{statusConfig.label}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Property Header */}
          <div className="relative h-48 md:h-64">
            <Image
              src={propertyImage}
              alt={agreement.lease.property.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h2 className="text-2xl font-semibold mb-2">{agreement.lease.property.title}</h2>
              <div className="flex items-center text-white/90">
                <MapPin size={16} className="mr-2" />
                <span>{agreement.lease.property.address}</span>
              </div>
            </div>
          </div>

          {/* Agreement Details */}
          <div className="p-6 space-y-6">
            {/* Lease Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <Calendar size={20} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Lease Period</p>
                  <p className="font-medium text-slate-900">
                    {formatDate(agreement.lease.startDate)} - {formatDate(agreement.lease.endDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Home size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Monthly Rent</p>
                  <p className="font-semibold text-green-600 text-xl">
                    RM {Number(agreement.lease.rentAmount).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Signing Parties */}
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Signing Parties</h3>
              <div className="space-y-4">
                {/* Landlord */}
                <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${agreement.landlordSigned
                  ? 'border-green-200 bg-green-50'
                  : 'border-slate-200 bg-slate-50'
                  }`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${agreement.landlordSigned ? 'bg-green-600' : 'bg-indigo-600'
                      }`}>
                      {agreement.lease.landlord.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Landlord</p>
                      <p className="font-semibold text-slate-900">{agreement.lease.landlord.name}</p>
                      <p className="text-sm text-slate-500">{agreement.lease.landlord.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {agreement.landlordSigned ? (
                      <div>
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">
                          <CheckCircle size={14} />
                          <span>Signed</span>
                        </span>
                        {agreement.landlordSignedAt && (
                          <p className="text-xs text-slate-500 mt-1">{formatDateTime(agreement.landlordSignedAt)}</p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-500 text-white text-sm font-medium rounded-full">
                        <Clock size={14} />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Tenant */}
                <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${agreement.tenantSigned
                  ? 'border-green-200 bg-green-50'
                  : 'border-slate-200 bg-slate-50'
                  }`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${agreement.tenantSigned ? 'bg-green-600' : 'bg-teal-600'
                      }`}>
                      {agreement.lease.tenant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Tenant</p>
                      <p className="font-semibold text-slate-900">{agreement.lease.tenant.name}</p>
                      <p className="text-sm text-slate-500">{agreement.lease.tenant.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {agreement.tenantSigned ? (
                      <div>
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">
                          <CheckCircle size={14} />
                          <span>Signed</span>
                        </span>
                        {agreement.tenantSignedAt && (
                          <p className="text-xs text-slate-500 mt-1">{formatDateTime(agreement.tenantSignedAt)}</p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-500 text-white text-sm font-medium rounded-full">
                        <Clock size={14} />
                        <span>{agreement.landlordSigned ? 'Awaiting' : 'Waiting for Landlord'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* PDF Download */}
            {agreement.pdfUrl && (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Agreement Document</h3>
                <a
                  href={agreement.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-3 px-5 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <Download size={20} className="text-indigo-600" />
                  <span className="font-medium text-slate-700">Download Full Agreement PDF</span>
                </a>
              </div>
            )}

            {/* Signature Section */}
            {canSign && !signSuccess && (
              <div className="border-t border-slate-100 pt-6">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Your Signature</h3>
                  <p className="text-slate-600 mb-6">
                    You are signing as <span className="font-semibold text-indigo-600">{userRole === 'landlord' ? 'Landlord' : 'Tenant'}</span>.
                    Please draw your signature below and confirm to proceed.
                  </p>

                  <div className="bg-white rounded-xl p-4 mb-6 border border-slate-200">
                    <SignaturePad
                      onSignatureChange={setSignature}
                      width={400}
                      height={200}
                    />
                  </div>

                  <label className="flex items-start space-x-3 mb-6 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700 leading-relaxed">
                      I confirm that I have read and agree to all terms and conditions in this rental agreement.
                      I understand that this digital signature is legally binding.
                    </span>
                  </label>

                  <button
                    onClick={handleSign}
                    disabled={!signature || !confirmed || signing}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {signing ? (
                      <span className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Signing...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center space-x-2">
                        <FileSignature size={20} />
                        <span>Sign as {userRole === 'landlord' ? 'Landlord' : 'Tenant'}</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Success Message */}
            {signSuccess && (
              <div className="border-t border-slate-100 pt-6">
                <div className="bg-green-50 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-800 mb-2">Signature Submitted Successfully!</h3>
                  <p className="text-green-700">
                    {agreement.status === 'COMPLETED'
                      ? 'Both parties have signed. The agreement is now complete!'
                      : 'Your signature has been recorded. Waiting for the other party to sign.'}
                  </p>
                </div>
              </div>
            )}

            {/* Completed Message */}
            {agreement.status === 'COMPLETED' && !canSign && !signSuccess && (
              <div className="border-t border-slate-100 pt-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-xl font-semibold text-green-800 mb-2">Agreement Completed</h3>
                  <p className="text-green-700">
                    This agreement was completed on {agreement.completedAt && formatDateTime(agreement.completedAt)}
                  </p>
                </div>
              </div>
            )}

            {/* Expiry Warning */}
            {agreement.expiresAt && agreement.status !== 'COMPLETED' && (
              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center space-x-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    This agreement must be signed by <span className="font-semibold">{formatDateTime(agreement.expiresAt)}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Cancel Agreement Button - Only for landlords, not completed/cancelled */}
            {userRole === 'landlord' && agreement.status !== 'COMPLETED' && agreement.status !== 'CANCELLED' && (
              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-red-800">Cancel Agreement</h4>
                    <p className="text-sm text-red-600">This action cannot be undone. The agreement will be permanently cancelled.</p>
                  </div>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <XCircle size={18} />
                    <span>Cancel Agreement</span>
                  </button>
                </div>
              </div>
            )}

            {/* Cancelled Status Display */}
            {agreement.status === 'CANCELLED' && (
              <div className="border-t border-slate-100 pt-6">
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <XCircle size={32} className="text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Agreement Cancelled</h3>
                  <p className="text-gray-600">
                    This agreement has been cancelled and is no longer valid.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <XCircle size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Cancel Agreement?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to cancel this agreement? This action cannot be undone and the agreement will be permanently marked as cancelled.
              </p>

              <div className="text-left">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancellation..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  disabled={cancelling}
                  className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-700 font-medium rounded-xl transition-colors"
                >
                  Keep Agreement
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  {cancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={18} />
                      <span>Cancel Agreement</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ContentWrapper>
  );
}
