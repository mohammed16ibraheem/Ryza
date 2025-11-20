'use client'

import Link from 'next/link'
import { FiArrowRight } from 'react-icons/fi'

const categories = [
  {
    name: 'Dresses',
    href: '/products/dresses',
    image: '/placeholder-category.jpg',
    description: 'Modest dresses',
  },
  {
    name: 'Hijabs',
    href: '/products/hijabs',
    image: '/placeholder-category.jpg',
    description: 'Beautiful hijab collection',
  },
  {
    name: 'Gift Hampers',
    href: '/products/gift-hampers',
    image: '/placeholder-category.jpg',
    description: 'Beautiful gift hampers with books, flowers & more',
  },
  {
    name: 'Hair Accessories',
    href: '/products/hair-accessories',
    image: '/placeholder-category.jpg',
    description: 'Complete your look',
  },
  {
    name: 'Offers',
    href: '/offers',
    image: '/placeholder-category.jpg',
    description: 'Limited-time deals & bundles',
  },
]

export default function Categories() {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our curated collections designed for the modern Muslim woman
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-primary-200 to-primary-300">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                  <p className="text-sm text-white/90 mb-3">{category.description}</p>
                  <div className="flex items-center text-white font-semibold group-hover:translate-x-2 transition-transform">
                    Shop Now
                    <FiArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

