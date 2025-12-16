import { NextRequest, NextResponse } from 'next/server'
import { getAuthHeader } from '@/utils/apiForwarder'

export async function POST(request: NextRequest) {
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
        const { currentPassword, newPassword } = body

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { success: false, message: 'Current password and new password are required' },
                { status: 400 }
            )
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, message: 'New password must be at least 6 characters' },
                { status: 400 }
            )
        }

        // Get the backend API URL
        const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://rentverse-be.jokoyuliyanto.my.id'

        // Try to forward to backend's change-password endpoint
        const endpoints = [
            '/api/auth/change-password',
            '/api/users/change-password',
            '/api/auth/password',
            '/api/users/password'
        ]

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${backendUrl}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        ...getAuthHeader(request),
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
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

        // If no backend endpoint supports password change, return informative error
        return NextResponse.json(
            {
                success: false,
                message: 'Password change is not available at this time. This feature requires backend API support which is not yet implemented.'
            },
            { status: 501 }
        )
    } catch (error) {
        console.error('Error during password change:', error)
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to change password'
            },
            { status: 500 }
        )
    }
}
