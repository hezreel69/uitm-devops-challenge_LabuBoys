import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')
        const body = await request.json()

        const response = await fetch(`${BACKEND_URL}/api/auth/mfa/enable`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': token }),
            },
            body: JSON.stringify(body),
        })

        const data = await response.json()

        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        console.error('MFA enable error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to enable MFA' },
            { status: 500 }
        )
    }
}
