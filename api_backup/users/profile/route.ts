import { NextRequest, NextResponse } from 'next/server'
import { getAuthHeader } from '@/utils/apiForwarder'

export async function PATCH(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, message: 'Authorization token required' },
                { status: 401 }
            )
        }

        // Parse request body
        const body = await request.json()
        const { firstName, lastName, phone, dateOfBirth } = body

        // Get the backend API URL
        const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://rentverse-be.jokoyuliyanto.my.id'

        // Try to forward to backend's profile update endpoint
        const endpoints = [
            '/api/users/profile',
            '/api/auth/profile',
            '/api/users/me',
            '/api/auth/me'
        ]

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${backendUrl}${endpoint}`, {
                    method: 'PATCH',
                    headers: {
                        ...getAuthHeader(request),
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        phone,
                        dateOfBirth,
                    }),
                })

                // If we get a non-404 response, process it
                if (response.status !== 404) {
                    const contentType = response.headers.get('content-type')
                    if (contentType?.includes('application/json')) {
                        const data = await response.json()
                        return NextResponse.json(data, { status: response.status })
                    }
                }
            } catch (err) {
                console.log(`Endpoint ${endpoint} failed:`, err)
                // Continue to next endpoint
            }
        }

        // If no backend endpoint supports profile update, return informative error
        return NextResponse.json(
            {
                success: false,
                message: 'Profile update is not available at this time. This feature requires backend API support which is not yet implemented.'
            },
            { status: 501 }
        )
    } catch (error) {
        console.error('Error during profile update:', error)
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update profile'
            },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, message: 'Authorization token required' },
                { status: 401 }
            )
        }

        // Get the backend API URL
        const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://rentverse-be.jokoyuliyanto.my.id'

        // Forward to backend's profile endpoint
        try {
            const response = await fetch(`${backendUrl}/api/auth/me`, {
                method: 'GET',
                headers: {
                    ...getAuthHeader(request),
                    'Content-Type': 'application/json',
                },
            })

            const contentType = response.headers.get('content-type')
            if (contentType?.includes('application/json')) {
                const data = await response.json()
                return NextResponse.json(data, { status: response.status })
            }
        } catch (err) {
            console.log('Profile fetch failed:', err)
        }

        return NextResponse.json(
            { success: false, message: 'Failed to fetch profile' },
            { status: 500 }
        )
    } catch (error) {
        console.error('Error fetching profile:', error)
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch profile'
            },
            { status: 500 }
        )
    }
}
