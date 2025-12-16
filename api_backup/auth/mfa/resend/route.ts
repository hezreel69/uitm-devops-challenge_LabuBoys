import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const response = await fetch(`${BACKEND_URL}/api/auth/mfa/resend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        const data = await response.json()

        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        console.error('MFA resend error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to resend OTP' },
            { status: 500 }
        )
    }
}
