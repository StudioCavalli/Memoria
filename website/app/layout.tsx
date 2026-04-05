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
  title: "Memoria \u2014 L\u2019IA biographique pour nos a\u00een\u00e9s",
  description:
    "Memoria est l\u2019IA biographique qui recueille les souvenirs de nos a\u00een\u00e9s et veille sur leur sant\u00e9 cognitive. Pr\u00e9servez la m\u00e9moire, d\u00e9tectez les troubles cognitifs.",
  keywords: [
    'Memoria',
    'IA biographique',
    'seniors',
    'souvenirs',
    'sant\u00e9 cognitive',
    'EHPAD',
    'biographie',
    'intelligence artificielle',
  ],
  openGraph: {
    title: "Memoria \u2014 L\u2019IA biographique pour nos a\u00een\u00e9s",
    description:
      "Recueillir les souvenirs, veiller sur la sant\u00e9 cognitive.",
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
