/**
 * Global Rate Limit Handler
 * Provides a way to trigger the rate limit modal from anywhere in the app
 */

type RateLimitCallback = (retryAfter?: string) => void

let rateLimitHandler: RateLimitCallback | null = null

export function registerRateLimitHandler(callback: RateLimitCallback) {
    rateLimitHandler = callback
}

export function unregisterRateLimitHandler() {
    rateLimitHandler = null
}

export function triggerRateLimitError(retryAfter?: string) {
    if (rateLimitHandler) {
        rateLimitHandler(retryAfter)
        return true
    }
    console.warn('Rate limit handler not registered')
    return false
}

/**
 * Check if a response is a rate limit error and handle it
 */
export async function handleRateLimitResponse(response: Response): Promise<boolean> {
    if (response.status === 429) {
        try {
            const data = await response.clone().json()
            const retryAfter = data.retryAfter || '15 minutes'
            triggerRateLimitError(retryAfter)
            return true
        } catch {
            triggerRateLimitError('15 minutes')
            return true
        }
    }
    return false
}
