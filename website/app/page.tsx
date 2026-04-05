import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Problem from '@/components/Problem'
import Solution from '@/components/Solution'
import HowItWorks from '@/components/HowItWorks'
import Sentinel from '@/components/Sentinel'
import Technology from '@/components/Technology'
import Pricing from '@/components/Pricing'
import CTA from '@/components/CTA'
import Footer from '@/components/Footer'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Memoria',
  alternateName: 'Foxcase',
  url: 'https://memoria-dusky.vercel.app',
  description:
    "L'IA biographique qui recueille les souvenirs de nos aînés et veille sur leur santé cognitive",
  address: {
    '@type': 'PostalAddress',
    streetAddress: '45 Boulevard de la Croisette',
    addressLocality: 'Cannes',
    postalCode: '06400',
    addressCountry: 'FR',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'christopher.cavalli@hotmail.com',
    telephone: '+33610449818',
  },
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main id="main-content" role="main" className="min-h-screen">
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <Sentinel />
        <Technology />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
