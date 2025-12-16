import React from 'react'
import type { Metadata } from 'next'
import { Poly, Manrope } from 'next/font/google'
import './globals.css'
import 'swiper/css'
import 'swiper/css/free-mode'
import 'swiper/css/scrollbar'
import '@maptiler/sdk/dist/maptiler-sdk.css'
import clsx from 'clsx'
import AuthInitializer from '@/components/AuthInitializer'
import { RateLimitProvider } from '@/components/RateLimitProvider'
import AppUrlListener from '@/components/AppUrlListener'

const poly = Poly({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-poly',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: 'Rentverse',
  description: 'Your rental platform',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={clsx([poly.className, manrope.className])}>
      <body>
        <RateLimitProvider>
          <AuthInitializer />
          <AppUrlListener />
          {children}
        </RateLimitProvider>
      </body>
    </html>
  )
}
