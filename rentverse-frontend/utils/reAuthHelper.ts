/**
 * Enhanced API call wrapper with re-authentication handling
 * Automatically detects when re-authentication is required and triggers modal
 */

export interface ReAuthResponse {
  success: false
  error: 'RE_AUTH_REQUIRED'
  message: string
  requireReAuth: true
  lastLogin?: string
  sessionExpiredMinutes?: number
}

export interface ApiCallOptions extends RequestInit {
  headers?: HeadersInit
  skipReAuth?: boolean
}

let reAuthModalTrigger: ((actionDescription: string, retryCallback: () => Promise<any>) => void) | null = null

/**
 * Register the re-auth modal trigger function
 * Call this from your root component or layout
 */
export function registerReAuthTrigger(
  trigger: (actionDescription: string, retryCallback: () => Promise<any>) => void
) {
  reAuthModalTrigger = trigger
}

/**
 * Make an API call with automatic re-auth handling
 * @param url - API endpoint URL
 * @param options - Fetch options (method, body, headers, etc.)
 * @param actionDescription - Human-readable description of the action (e.g., "complete booking")
 * @returns Fetch response
 */
export async function apiCallWithReAuth(
  url: string,
  options: ApiCallOptions = {},
  actionDescription: string = 'perform this action'
): Promise<Response> {
  const makeRequest = async (): Promise<Response> => {
    const response = await fetch(url, options)
    
    // Check if re-auth is required
    if (!options.skipReAuth && response.status === 403) {
      const data = await response.json()
      
      if (data.requireReAuth === true) {
        // Trigger re-auth modal if registered
        if (reAuthModalTrigger) {
          return new Promise((resolve, reject) => {
            reAuthModalTrigger!(actionDescription, async () => {
              try {
                // Retry the original request after re-auth
                const retryResponse = await fetch(url, options)
                resolve(retryResponse)
                return retryResponse
              } catch (error) {
                reject(error)
                throw error
              }
            })
          })
        } else {
          // Fallback: redirect to login
          console.warn('Re-auth modal not registered, redirecting to login')
          window.location.href = '/auth'
          throw new Error('Re-authentication required')
        }
      }
    }
    
    return response
  }

  return makeRequest()
}

/**
 * Helper to check if a response indicates re-auth is required
 */
export function isReAuthRequired(response: any): response is ReAuthResponse {
  return (
    response &&
    response.success === false &&
    response.error === 'RE_AUTH_REQUIRED' &&
    response.requireReAuth === true
  )
}

/**
 * Extract actionDescription from error response
 */
export function getReAuthMessage(response: ReAuthResponse): string {
  if (response.sessionExpiredMinutes) {
    return `Your session expired ${response.sessionExpiredMinutes} minutes ago. ${response.message}`
  }
  return response.message
}
