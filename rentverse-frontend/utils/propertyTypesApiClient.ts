import type { PropertyTypesResponse } from '@/types/property'
import { getApiUrl } from './apiConfig'
import { handleRateLimitResponse } from './rateLimitHandler'

const BASE_URL = getApiUrl()

export class PropertyTypesApiClient {
  private static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('authToken')
  }

  static async getPropertyTypes(): Promise<PropertyTypesResponse> {
    const token = this.getAuthToken()

    const headers: Record<string, string> = {
      'accept': 'application/json',
    }

    // Add authorization header if token is available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${BASE_URL}/property-types?page=1&limit=10`, {
        method: 'GET',
        headers,
        mode: 'cors',
        cache: 'no-cache',
      })

      // Handle rate limit errors with modal
      if (response.status === 429) {
        await handleRateLimitResponse(response)
        throw new Error('Rate limit exceeded. Please wait and try again.')
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching property types:', error)
      throw error
    }
  }
}