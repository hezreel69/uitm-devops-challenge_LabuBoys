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
import IdleTimeout from '@/components/IdleTimeout'
import SessionExpiredModal from '@/components/SessionExpiredModal'

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
  title: 'RentVerse - Property Rental Platform',
  description: 'Modern, secure, and intelligent property rental platform with advanced security and digital agreement signing',
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  },
  themeColor: '#0d9488',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RentVerse',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={clsx([poly.className, manrope.className])}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d9488" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <RateLimitProvider>
          <AuthInitializer />
          <AppUrlListener />
          <IdleTimeout timeoutSeconds={900} />
          <SessionExpiredModal />
          {children}
        </RateLimitProvider>
      </body>
    </html>
  )
}
