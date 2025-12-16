'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ButtonCircle from '@/components/ButtonCircle'
import { ArrowLeft, Share, Heart } from 'lucide-react'
import { FavoritesApiClient } from '@/utils/favoritesApiClient'
import { ShareService } from '@/utils/shareService'
import useAuthStore from '@/stores/authStore'
import clsx from 'clsx'

interface BarPropertyProps {
  title: string
  propertyId?: string
  isFavorited?: boolean
  onFavoriteChange?: (isFavorited: boolean, favoriteCount: number) => void
  shareUrl?: string
  shareText?: string
}

function BarProperty(props: Readonly<BarPropertyProps>) {
  const router = useRouter()
  const { isLoggedIn } = useAuthStore()
  const [isFavorited, setIsFavorited] = useState(props.isFavorited || false)
  const [isToggling, setIsToggling] = useState(false)

  const handleBackButton = () => {
    router.back()
  }

  const handleFavoriteToggle = async () => {
    if (!props.propertyId) {
      console.warn('No property ID provided for favorite toggle')
      return
    }

    if (!isLoggedIn) {
      // Redirect to login or show login modal
      console.log('User not logged in, should redirect to login')
      return
    }

    try {
      setIsToggling(true)
      const response = await FavoritesApiClient.toggleFavorite(props.propertyId)

      if (response.success) {
        setIsFavorited(response.data.isFavorited)
        // Notify parent component about the change
        props.onFavoriteChange?.(response.data.isFavorited, response.data.favoriteCount)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      // You might want to show a toast notification here
    } finally {
      setIsToggling(false)
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: props.title || 'Check out this property',
      text: props.shareText || `Check out this amazing property: ${props.title}`,
      url: props.shareUrl || (typeof window !== 'undefined' ? window.location.href : ''),
    }

    try {
      const success = await ShareService.share(shareData, {
        showToast: true,
        fallbackMessage: 'Property link copied to clipboard!'
      })

      if (success) {
        console.log('Property shared successfully')
      }
    } catch (error) {
      console.error('Error sharing property:', error)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-100">
      {/* Left side - Back button and title */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
        <ButtonCircle icon={<ArrowLeft size={18} />} onClick={handleBackButton} />
        <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
          {props.title}
        </h1>
      </div>

      {/* Right side - Share and Favourites buttons */}
      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        <button
          onClick={handleShare}
          className={clsx([
            'flex items-center space-x-1 sm:space-x-2 text-gray-600 cursor-pointer p-2 sm:p-0',
            'hover:text-gray-900 transition-colors rounded-lg sm:hover:underline',
          ])}
        >
          <Share size={16} className="sm:w-[14px] sm:h-[14px]" />
          <span className="text-sm font-medium hidden sm:inline">Share</span>
        </button>
        <button
          onClick={handleFavoriteToggle}
          disabled={isToggling || !props.propertyId}
          className={clsx([
            'flex items-center space-x-1 sm:space-x-2 cursor-pointer transition-colors p-2 sm:p-0 rounded-lg',
            'disabled:opacity-50 disabled:cursor-not-allowed sm:hover:underline',
            isFavorited
              ? 'text-red-600 hover:text-red-700'
              : 'text-gray-600 hover:text-gray-900'
          ])}
        >
          <Heart
            size={16}
            className={clsx([
              'sm:w-[14px] sm:h-[14px]',
              isFavorited ? 'fill-current' : ''
            ])}
          />
          <span className="text-sm font-medium hidden sm:inline">
            {(() => {
              if (isToggling) return 'Updating...'
              return isFavorited ? 'Saved' : 'Save'
            })()}
          </span>
        </button>
      </div>
    </div>
  )
}

export default BarProperty