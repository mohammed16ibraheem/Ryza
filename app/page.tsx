import Hero from '@/components/Hero'
import Categories from '@/components/Categories'
import FeaturedProducts from '@/components/FeaturedProducts'
import Offers from '@/components/Offers'

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

