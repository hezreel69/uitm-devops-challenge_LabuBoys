'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/stores/authStore'
import { setCookie } from '@/utils/cookies'

// Check if we're in a Capacitor environment
const isCapacitor = typeof window !== 'undefined' &&
    (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()

export function useAppUrlListener() {
    const router = useRouter()
    const { validateToken } = useAuthStore()

    useEffect(() => {
        if (!isCapacitor) return

        const setupAppUrlListener = async () => {
            try {
                const { App } = await import('@capacitor/app')

                // Listen for app URL open events (deep links)
                const urlOpenListener = await App.addListener('appUrlOpen', async (event) => {
                    console.log('App URL opened:', event.url)

                    // Parse the URL
                    const url = new URL(event.url)

                    // Check if it's an auth callback
                    if (url.pathname === '/auth/callback' || url.host === 'auth') {
                        const token = url.searchParams.get('token')
                        const error = url.searchParams.get('error')
                        const provider = url.searchParams.get('provider')

                        if (error) {
                            console.error('OAuth error:', error)
                            router.push(`/auth?error=${error}`)
                            return
                        }

                        if (token) {
                            try {
                                // Store the token
                                localStorage.setItem('authToken', token)
                                setCookie('authToken', token, 7)

                                // Validate the token
                                const isValid = await validateToken()

                                if (isValid) {
                                    console.log('OAuth login successful')
                                    router.push('/')
                                } else {
                                    console.error('Token validation failed')
                                    localStorage.removeItem('authToken')
                                    router.push('/auth?error=invalid_token')
                                }
                            } catch (err) {
                                console.error('Error processing OAuth token:', err)
                                localStorage.removeItem('authToken')
                                router.push('/auth?error=auth_failed')
                            }
                        }
                    }
                })

                // Return cleanup function
                return () => {
                    urlOpenListener.remove()
                }
            } catch (error) {
                console.error('Error setting up App URL listener:', error)
            }
        }

        setupAppUrlListener()
    }, [router, validateToken])
}

export default function AppUrlListener() {
    useAppUrlListener()
    return null
}
