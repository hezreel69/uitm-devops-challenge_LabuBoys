'use client'

import Link from 'next/link'
import Image from 'next/image'
import ContentWrapper from '@/components/ContentWrapper'
import CardProperty from '@/components/CardProperty'
import { Search, Heart, RefreshCw } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import useAuthStore from '@/stores/authStore'
import { useEffect } from 'react'

function WishlistPage() {
  const { isLoggedIn } = useAuthStore()
  const { favorites, isLoading, error, fetchFavorites } = useFavorites()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      // You might want to redirect to login page here
      console.log('User not authenticated')
    }
  }, [isLoggedIn])

  const handleRefresh = () => {
    fetchFavorites()
  }

  if (!isLoggedIn) {
    return (
      <ContentWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex-1 flex items-center justify-center py-12 sm:py-16">
            <div className="text-center space-y-6 max-w-md px-4">
              <div className="flex justify-center">
                <Heart className="w-14 h-14 sm:w-16 sm:h-16 text-slate-400" />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg sm:text-xl font-sans font-medium text-slate-900">
                  Please log in to view your wishlist
                </h3>
                <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                  Sign in to save and manage your favorite properties
                </p>
              </div>
              <Link
                href="/auth"
                className="inline-flex px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
        {/* Bottom spacing for mobile nav */}
        <div className="h-20 md:hidden"></div>
      </ContentWrapper>
    )
  }

  return (
    <ContentWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header - Stacks on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-sans font-medium text-slate-900">My Wishlist</h3>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <Link
              href="/property"
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
            >
              <Search size={16} />
              <span className="text-sm font-medium">Browse</span>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
              <p className="text-slate-600">Loading your favorites...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="text-center space-y-6 max-w-md px-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg sm:text-xl font-sans font-medium text-slate-900">
                  Unable to load wishlist
                </h3>
                <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                  {error}
                </p>
              </div>
              <button
                onClick={handleRefresh}
                className="inline-flex px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Property Grid - Better mobile spacing */}
        {!isLoading && !error && favorites.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {favorites.map((property) => (
              <div key={property.id} className="group">
                <CardProperty property={property} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && favorites.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-12 sm:py-16">
            <div className="text-center space-y-6 max-w-md px-4">
              <div className="flex justify-center">
                <Image
                  src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758310328/rentverse-base/image_17_hsznyz.png"
                  alt="No wishlist items"
                  width={240}
                  height={240}
                  className="w-48 h-48 sm:w-60 sm:h-60 object-contain"
                />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg sm:text-xl font-sans font-medium text-slate-900">
                  Your wishlist is empty
                </h3>
                <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                  Start exploring properties to add them to your wishlist
                </p>
              </div>
              <Link
                href="/property"
                className="inline-flex px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors duration-200"
              >
                Explore Properties
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Bottom spacing for mobile nav */}
      <div className="h-20 md:hidden"></div>
    </ContentWrapper>
  )
}

export default WishlistPage