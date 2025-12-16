interface LocationType {
  icon: string
  name: string
  description: string
}

interface PropertyType {
  icon: string
  name: string
  description: string
}

type GetAllLocationsType = () => Array<LocationType>
type GetAllPropertyTypesType = () => Array<PropertyType>

const locations: Array<LocationType> = [
  // States
  {
    icon: '🏢',
    name: 'Kuala Lumpur',
    description: 'Malaysia\'s bustling capital city',
  },
  {
    icon: '🏛️',
    name: 'Penang',
    description: 'UNESCO World Heritage with rich culture',
  },
  {
    icon: '🌆',
    name: 'Selangor',
    description: 'Most developed state surrounding KL',
  },
  {
    icon: '🌺',
    name: 'Johor',
    description: 'Southern gateway near Singapore',
  },
  {
    icon: '🏰',
    name: 'Melaka',
    description: 'Historic city with colonial heritage',
  },
  {
    icon: '🏔️',
    name: 'Perak',
    description: 'Limestone caves and heritage buildings',
  },
  {
    icon: '🌴',
    name: 'Kedah',
    description: 'Rice bowl of Malaysia with Langkawi',
  },
  {
    icon: '🏞️',
    name: 'Pahang',
    description: 'Largest state with Cameron Highlands',
  },
  {
    icon: '⛱️',
    name: 'Terengganu',
    description: 'Beautiful beaches and islands',
  },
  {
    icon: '🕌',
    name: 'Kelantan',
    description: 'Cultural heartland of Malaysia',
  },
  {
    icon: '🌳',
    name: 'Negeri Sembilan',
    description: 'Minangkabau heritage and traditions',
  },
  {
    icon: '🌿',
    name: 'Perlis',
    description: 'Smallest state in the north',
  },
  {
    icon: '🏖️',
    name: 'Sabah',
    description: 'Land below the wind in Borneo',
  },
  {
    icon: '🌊',
    name: 'Sarawak',
    description: 'Land of the hornbills in Borneo',
  },
  // Federal Territories
  {
    icon: '🕌',
    name: 'Putrajaya',
    description: 'Malaysia\'s administrative capital',
  },
  {
    icon: '🏝️',
    name: 'Labuan',
    description: 'Offshore financial center',
  },
]

const propertyTypes: Array<PropertyType> = [
  {
    icon: '🏢',
    name: 'Property',
    description: 'All types of properties',
  },
  {
    icon: '🏬',
    name: 'Condominium',
    description: 'Modern condo living',
  },
  {
    icon: '🏠',
    name: 'Apartment',
    description: 'Urban apartment units',
  },
  {
    icon: '🏡',
    name: 'House',
    description: 'Single family homes',
  },
  {
    icon: '🏘️',
    name: 'Townhouse',
    description: 'Multi-story attached homes',
  },
  {
    icon: '🏰',
    name: 'Villa',
    description: 'Luxury standalone villas',
  },
  {
    icon: '🏙️',
    name: 'Penthouse',
    description: 'Top-floor luxury units',
  },
]

export const getAllLocations: GetAllLocationsType = () => {
  return locations
}

export const getAllPropertyTypes: GetAllPropertyTypesType = () => {
  return propertyTypes
}

// Property types for listing creation (excludes generic "Property" option)
export const getPropertyTypesForListing: GetAllPropertyTypesType = () => {
  return propertyTypes.filter(type => type.name !== 'Property')
}
