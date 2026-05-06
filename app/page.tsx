import { Metadata } from 'next'
import Hero from '@/components/Hero'
import Categories from '@/components/Categories'
import FeaturedProducts from '@/components/FeaturedProducts'
import Offers from '@/components/Offers'
import { homeMetadata } from './metadata'

export const metadata: Metadata = homeMetadata

export default function Home() {
  return (
    <div className="w-full">
      <Hero />
      <Categories />
      <FeaturedProducts />
      <Offers />
    </div>
  )
}

