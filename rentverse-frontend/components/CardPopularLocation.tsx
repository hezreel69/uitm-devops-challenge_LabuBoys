'use client'

import type { LocationBaseType } from '@/types/location'
import Image from 'next/image'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import usePropertiesStore from '@/stores/propertiesStore'

function CardPopularLocation({ location }: { location: LocationBaseType }) {
  const router = useRouter()
  const { setWhereValue, searchProperties } = usePropertiesStore()

  const handleClick = async () => {
    // Use searchKey if available, otherwise use name
    const searchTerm = location.searchKey || location.name
    // Set the location filter in the store
    setWhereValue(searchTerm)
    // Search with the location
    await searchProperties({ city: searchTerm, page: 1, limit: 10 })
    // Navigate to results page
    router.push('/property/result')
  }

  return (
    <div
      onClick={handleClick}
      className={clsx([
        'flex flex-col items-center justify-center gap-y-2 cursor-pointer',
        'hover:scale-105 transition-all duration-300',
      ])}
    >
      <Image
        src={location.imageUrl}
        alt={location.name}
        width={320}
        height={320}
        className='h-auto aspect-square object-cover rounded-3xl'
      />
      <h3 className='text-lg font-semibold text-slate-600'>{location.name}</h3>
    </div>
  )
}

export default CardPopularLocation
