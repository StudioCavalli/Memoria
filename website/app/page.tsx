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

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <Sentinel />
      <Technology />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
