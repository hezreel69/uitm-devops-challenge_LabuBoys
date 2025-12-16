'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Lock, AlertCircle } from 'lucide-react'

interface ReAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  actionDescription?: string
}

export default function ReAuthModal({
  isOpen,
  onClose,
  onSuccess,
  actionDescription = 'this action'
}: ReAuthModalProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get user email from localStorage or auth store
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        throw new Error('User not found. Please log in again.')
      }

      const user = JSON.parse(userStr)
      const email = user.email

      // Call login endpoint to verify password and refresh session
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Update token in localStorage
        localStorage.setItem('authToken', data.data.token)
        
        // Close modal and trigger retry
        setPassword('')
        onSuccess()
        onClose()
      } else {
        setError(data.message || 'Invalid password')
      }
    } catch (err: unknown) {
      console.error('Re-auth error:', err)
      setError(err instanceof Error ? err.message : 'Failed to verify identity')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setPassword('')
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Verify Your Identity</h3>
                <p className="text-sm text-white/90 mt-1">Required for security</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Recent authentication required</p>
              <p>
                For your security, please re-enter your password to confirm{' '}
                <span className="font-semibold">{actionDescription}</span>.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !password}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Verifying...
                </span>
              ) : (
                'Confirm Identity'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
