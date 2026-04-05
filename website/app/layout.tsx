import type { Metadata } from 'next'
import { Merriweather, Nunito } from 'next/font/google'
import './globals.css'

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
  title: "Memoria — L'IA biographique pour nos aînés",
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
  ],
  openGraph: {
    title: "Memoria — L'IA biographique pour nos aînés",
    description:
      "Recueillir les souvenirs, veiller sur la santé cognitive.",
    type: 'website',
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
        {children}
      </body>
    </html>
  )
}
