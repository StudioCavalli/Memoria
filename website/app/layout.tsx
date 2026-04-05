import type { Metadata } from 'next'
import { Merriweather, Nunito } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-heading',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://memoria-dusky.vercel.app'),
  title: {
    default: "Memoria — L'IA biographique pour nos aînés",
    template: '%s | Memoria',
  },
  description:
    "Memoria est l'IA biographique qui recueille les souvenirs de nos aînés et veille sur leur santé cognitive. Préservez la mémoire, détectez les troubles cognitifs.",
  keywords: [
    'Memoria',
    'IA biographique',
    'seniors',
    'souvenirs',
    'santé cognitive',
    'EHPAD',
    'biographie',
    'intelligence artificielle',
    'Silver Économie',
    'Nice',
    'Cannes',
    'Foxcase',
    'troubles cognitifs',
    'Alzheimer',
    'prévention',
    'détection précoce',
  ],
  authors: [{ name: 'Christopher Cavalli', url: 'https://memoria-dusky.vercel.app' }],
  creator: 'Christopher Cavalli',
  publisher: 'Foxcase',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Memoria — L'IA biographique pour nos aînés",
    description:
      "L'IA biographique qui recueille les souvenirs de nos aînés et veille sur leur santé cognitive. Préservez la mémoire, détectez les troubles cognitifs.",
    url: 'https://memoria-dusky.vercel.app',
    type: 'website',
    siteName: 'Memoria',
    locale: 'fr_FR',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: "Memoria — L'IA biographique pour nos aînés",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Memoria — L'IA biographique pour nos aînés",
    description:
      "L'IA biographique qui recueille les souvenirs de nos aînés et veille sur leur santé cognitive.",
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://memoria-dusky.vercel.app',
  },
  verification: {
    google: 'GOOGLE_VERIFICATION_CODE',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="fr"
      className={`${merriweather.variable} ${nunito.variable}`}
    >
      <body className="font-body bg-cream text-text-dark antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
