'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { ArrowDownWideNarrow, Check } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Scrollbar, Mousewheel } from 'swiper/modules'
import usePropertiesStore from '@/stores/propertiesStore'
import MapViewer from '@/components/MapViewer'
import Pagination from '@/components/Pagination'
import CardProperty from '@/components/CardProperty'
import ContentWrapper from '@/components/ContentWrapper'
import ButtonSecondary from '@/components/ButtonSecondary'
import ButtonMapViewSwitcher from '@/components/ButtonMapViewSwitcher'

// Sort options
type SortOption = 'recommended' | 'price_low' | 'price_high' | 'newest' | 'bedrooms'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'bedrooms', label: 'Most Bedrooms' },
]

function ResultsPage() {
  const { properties, isLoading, loadProperties, mapData, whereValue, typeValue, pagination } = usePropertiesStore()
  const [isMapView, setIsMapView] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('recommended')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load properties when component mounts, using filter values from search box
    const filters: { limit: number; page: number; city?: string; type?: string } = { limit: 10, page: currentPage }
    if (whereValue) filters.city = whereValue
    if (typeValue) filters.type = typeValue
    loadProperties(filters)
  }, [loadProperties, whereValue, typeValue, currentPage])

  // Close sort dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sort properties based on selected option
  const sortedProperties = useMemo(() => {
    if (!properties || properties.length === 0) return properties

    const sorted = [...properties]

    switch (sortBy) {
      case 'price_low':
        sorted.sort((a, b) => Number(a.price) - Number(b.price))
        break
      case 'price_high':
        sorted.sort((a, b) => Number(b.price) - Number(a.price))
        break
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'bedrooms':
        sorted.sort((a, b) => b.bedrooms - a.bedrooms)
        break
      case 'recommended':
      default:
        // Keep original order (from API)
        break
    }

    return sorted
  }, [properties, sortBy])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle sort selection
  const handleSortSelect = (option: SortOption) => {
    setSortBy(option)
    setIsSortOpen(false)
  }

  const toggleView = () => {
    setIsMapView(!isMapView)
  }

  // Helper function to group properties based on screen size
  const getGroupedProperties = (itemsPerSlide: number) => {
    const grouped = []
    for (let i = 0; i < sortedProperties.length; i += itemsPerSlide) {
      grouped.push(sortedProperties.slice(i, i + itemsPerSlide))
    }
    return grouped
  }

  // Map configuration - use real data from backend if available (memoized)
  const mapCenter = useMemo(() => {
    console.log('Computing map center with mapData:', mapData)

    if (mapData?.latMean && mapData?.longMean) {
      console.log('Using API map center:', { lng: mapData.longMean, lat: mapData.latMean })
      return { lng: mapData.longMean, lat: mapData.latMean }
    }

    console.log('Using fallback map center')
    return { lng: 101.6953, lat: 3.1390 } // Fallback to Malaysia (Kuala Lumpur)
  }, [mapData])

  const mapZoom = mapData?.depth || 12

  console.log('Map center result:', mapCenter)
  console.log('Map zoom:', mapZoom)

  // Create markers from properties data (memoized to prevent re-rendering)
  const propertyMarkers = useMemo(() => {
    return properties.map((property, index) => {
      let lng, lat

      if (property.longitude && property.latitude) {
        // Use real coordinates if available
        lng = property.longitude
        lat = property.latitude
      } else {
        // Fallback: distribute properties in a grid pattern around map center
        const gridSize = Math.ceil(Math.sqrt(properties.length))
        const gridX = index % gridSize
        const gridY = Math.floor(index / gridSize)
        const offsetRange = 0.02 // Roughly 2km range

        lng = mapCenter.lng + (gridX - gridSize / 2) * (offsetRange / gridSize) + (Math.random() - 0.5) * 0.005
        lat = mapCenter.lat + (gridY - gridSize / 2) * (offsetRange / gridSize) + (Math.random() - 0.5) * 0.005
      }

      // Get the first image or use a placeholder
      const propertyImages = property.images || []
      const mainImage = propertyImages.length > 0
        ? propertyImages[0]
        : 'https://placehold.co/300x200/e2e8f0/64748b?text=No+Image'

      // Format price with proper currency
      const formattedPrice = new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: property.currencyCode || 'MYR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(property.price))

      // Get property type name - safely handle both object and string types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typeValue = property.type as any
      const propertyTypeName = property.propertyType?.name || (typeValue?.name || typeValue) || 'Property'

      return {
        lng,
        lat,
        popup: `
          <div style="width: 280px; padding: 0; margin: -10px -10px -15px -10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <!-- Property Image -->
            <div style="position: relative; width: 100%; height: 140px; overflow: hidden; border-radius: 8px 8px 0 0;">
              <img 
                src="${mainImage}" 
                alt="${property.title}"
                style="width: 100%; height: 100%; object-fit: cover;"
                onerror="this.src='https://placehold.co/300x200/e2e8f0/64748b?text=No+Image'"
              />
              <!-- Property Type Badge -->
              <div style="position: absolute; top: 8px; left: 8px; background: rgba(255,255,255,0.95); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; color: #0d9488; backdrop-filter: blur(4px);">
                ${propertyTypeName}
              </div>
              <!-- Image count badge -->
              ${propertyImages.length > 1 ? `
                <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); padding: 3px 8px; border-radius: 12px; font-size: 10px; color: white; display: flex; align-items: center; gap: 4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  ${propertyImages.length}
                </div>
              ` : ''}
            </div>
            
            <!-- Property Details -->
            <div style="padding: 12px 14px 14px;">
              <!-- Title -->
              <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #1e293b; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${property.title}
              </h3>
              
              <!-- Location -->
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${property.city}, ${property.state}
                </span>
              </p>
              
              <!-- Features Row -->
              <div style="display: flex; gap: 12px; margin-bottom: 12px; padding: 8px 10px; background: #f8fafc; border-radius: 6px;">
                <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: #475569;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 4v16M22 4v16M6 12h12M6 4h12v16H6z"></path>
                  </svg>
                  <span><strong>${property.bedrooms}</strong> bed</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: #475569;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 12h16M4 12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v6H4v-6"></path>
                    <path d="M6 12V5a2 2 0 0 1 2-2h3v9"></path>
                  </svg>
                  <span><strong>${property.bathrooms}</strong> bath</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: #475569;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  </svg>
                  <span><strong>${property.areaSqm || property.area || 0}</strong> m²</span>
                </div>
              </div>
              
              <!-- Price and CTA Row -->
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0d9488;">
                    ${formattedPrice}
                  </p>
                  <p style="margin: 2px 0 0 0; font-size: 10px; color: #94a3b8;">per month</p>
                </div>
                <a 
                  href="/property/${property.id}" 
                  style="display: inline-flex; align-items: center; gap: 4px; padding: 8px 14px; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px; transition: all 0.2s;"
                  onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(13,148,136,0.3)';"
                  onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
                >
                  View
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        `,
        color: '#0D9488', // Teal color to match the theme
        propertyId: property.id, // Add property ID for potential click handling
      }
    })
  }, [properties, mapCenter])

  // Debug logging
  console.log('Properties count:', properties.length)
  console.log('Map center:', mapCenter)
  console.log('Property markers:', propertyMarkers)

  return (
    <ContentWrapper searchBoxType="compact">
      <div className="w-full py-4 px-2 sm:px-4 md:px-8 lg:px-12 flex justify-between items-start gap-x-5">
        {/* Property Card Results */}
        <div className={`w-full md:w-1/2 ${isMapView ? 'hidden' : 'block'}`}>
          {/* Header Result */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex flex-col gap-2">
              <h3 className="font-serif text-xl text-teal-900">
                {sortedProperties.length} homes within map area
              </h3>
              <p className="text-base text-teal-800">
                Showing 1 – {sortedProperties.length}
              </p>
            </div>

            {/* Sort Dropdown */}
            <div ref={sortRef} className="relative">
              <ButtonSecondary
                iconLeft={<ArrowDownWideNarrow size={16} />}
                label={sortOptions.find(o => o.value === sortBy)?.label || 'Sort'}
                onClick={() => setIsSortOpen(!isSortOpen)}
              />

              {/* Dropdown Menu */}
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortSelect(option.value)}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span className={sortBy === option.value ? 'font-medium text-teal-600' : 'text-slate-700'}>
                        {option.label}
                      </span>
                      {sortBy === option.value && (
                        <Check size={16} className="text-teal-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vertical Scrollable Results */}
          <div className="h-[70vh] overflow-hidden">
            {/* Mobile: 1 column */}
            <div className="block sm:hidden h-full">
              <Swiper
                direction="vertical"
                slidesPerView="auto"
                spaceBetween={16}
                scrollbar={{
                  hide: false,
                  draggable: true,
                }}
                mousewheel={{
                  enabled: true,
                  forceToAxis: true,
                }}
                modules={[Scrollbar, Mousewheel]}
                className="h-full"
                style={{ height: '100%' }}
              >
                {sortedProperties.map((property) => (
                  <SwiperSlide key={property.id} className="!h-auto">
                    <div className="pr-4 mb-4">
                      <CardProperty property={property} />
                    </div>
                  </SwiperSlide>
                ))}

                {/* Pagination as last slide */}
                <SwiperSlide className="!h-auto">
                  <div className="py-8 flex justify-center items-center pr-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={pagination.pages || 1}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </SwiperSlide>
              </Swiper>
            </div>

            {/* Small screens: 2 columns */}
            <div className="hidden sm:block md:hidden h-full">
              <Swiper
                direction="vertical"
                slidesPerView="auto"
                spaceBetween={16}
                scrollbar={{
                  hide: false,
                  draggable: true,
                }}
                mousewheel={{
                  enabled: true,
                  forceToAxis: true,
                }}
                modules={[Scrollbar, Mousewheel]}
                className="h-full"
                style={{ height: '100%' }}
              >
                {getGroupedProperties(2).map((group, index) => (
                  <SwiperSlide key={index} className="!h-auto">
                    <div className="grid grid-cols-2 gap-4 pr-4 mb-4">
                      {group.map((property) => (
                        <CardProperty key={property.id} property={property} />
                      ))}
                    </div>
                  </SwiperSlide>
                ))}

                {/* Pagination as last slide */}
                <SwiperSlide className="!h-auto">
                  <div className="py-8 flex justify-center items-center pr-4 col-span-2">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={pagination.pages || 1}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </SwiperSlide>
              </Swiper>
            </div>

            {/* Medium screens (tablets): 1 column */}
            <div className="hidden md:block lg:hidden h-full">
              <Swiper
                direction="vertical"
                slidesPerView="auto"
                spaceBetween={16}
                scrollbar={{
                  hide: false,
                  draggable: true,
                }}
                mousewheel={{
                  enabled: true,
                  forceToAxis: true,
                }}
                modules={[Scrollbar, Mousewheel]}
                className="h-full"
                style={{ height: '100%' }}
              >
                {sortedProperties.map((property) => (
                  <SwiperSlide key={property.id} className="!h-auto">
                    <div className="pr-4 mb-4">
                      <CardProperty property={property} />
                    </div>
                  </SwiperSlide>
                ))}

                {/* Pagination as last slide */}
                <SwiperSlide className="!h-auto">
                  <div className="py-8 flex justify-center items-center pr-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={pagination.pages || 1}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </SwiperSlide>
              </Swiper>
            </div>

            {/* Large screens: 2 columns */}
            <div className="hidden lg:block h-full">
              <Swiper
                direction="vertical"
                slidesPerView="auto"
                spaceBetween={16}
                scrollbar={{
                  hide: false,
                  draggable: true,
                }}
                mousewheel={{
                  enabled: true,
                  forceToAxis: true,
                }}
                modules={[Scrollbar, Mousewheel]}
                className="h-full"
                style={{ height: '100%' }}
              >
                {getGroupedProperties(2).map((group, index) => (
                  <SwiperSlide key={index} className="!h-auto">
                    <div className="grid grid-cols-2 gap-4 pr-4 mb-4">
                      {group.map((property) => (
                        <CardProperty key={property.id} property={property} />
                      ))}
                    </div>
                  </SwiperSlide>
                ))}

                {/* Pagination as last slide */}
                <SwiperSlide className="!h-auto">
                  <div className="py-8 flex justify-center items-center pr-4 col-span-2">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={pagination.pages || 1}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </SwiperSlide>
              </Swiper>
            </div>
          </div>
        </div>

        {/* Map Results */}
        <div className={`w-full md:w-1/2 ${isMapView ? 'block' : 'hidden md:block'}`}>
          {isLoading ? (
            <div className="w-full h-[80vh] bg-gray-100 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading properties...</p>
              </div>
            </div>
          ) : properties.length === 0 ? (
            <div className="w-full h-[80vh] bg-gray-100 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <p className="text-gray-600 text-lg mb-2">No properties found</p>
                <p className="text-gray-500">Try adjusting your search criteria</p>
              </div>
            </div>
          ) : (
            // Only render MapViewer if we're not loading and have map data
            !isLoading ? (
              <MapViewer
                center={mapCenter}
                zoom={mapZoom}
                markers={propertyMarkers}
                onMapClick={(coords) => console.log('Clicked:', coords)}
                className="shadow-lg"
                height="80vh"
              />
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-600 text-lg mb-2">Loading map...</p>
                  <p className="text-gray-500">Fetching location data</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Map/List View Switcher Button - Mobile/Tablet Only */}
      <div className="md:hidden">
        <ButtonMapViewSwitcher
          onClick={toggleView}
          isMapView={isMapView}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
        />
      </div>
    </ContentWrapper>
  )
}

export default ResultsPage
