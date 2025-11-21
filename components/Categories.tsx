'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiArrowRight } from 'react-icons/fi'
import Image from 'next/image'

const categories = [
  {
    name: 'Salah Essential',
    href: '/products/salah-essential',
    key: 'salah-essential',
    description: 'Modest dresses',
  },
  {
    name: 'Hijabs',
    href: '/products/hijabs',
    key: 'hijabs',
    description: 'Beautiful hijab collection',
  },
  {
    name: 'Gift Hampers',
    href: '/products/gift-hampers',
    key: 'gift-hampers',
    description: 'Beautiful gift hampers with books, flowers & more',
  },
  {
    name: 'Hair Essentials',
    href: '/products/hair-essentials',
    key: 'hair-essentials',
    description: 'Complete your look',
  },
  {
    name: 'Jewellery',
    href: '/products/jewellery',
    key: 'jewellery',
    description: 'Elegant jewellery collection',
  },
  {
    name: 'Offers',
    href: '/offers',
    key: 'offers',
    description: 'Limited-time deals & bundles',
  },
]

export default function Categories() {
  const [thumbnails, setThumbnails] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchThumbnails = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/category-thumbnails', {
          cache: 'no-store' // Always fetch fresh data
        })
        const data = await response.json()
        setThumbnails(data.thumbnails || {})
      } catch (error) {
        console.error('Error fetching thumbnails:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchThumbnails()
    
    // Refresh thumbnails every 30 seconds to catch updates
    const interval = setInterval(fetchThumbnails, 30000)
    return () => clearInterval(interval)
  }, [])
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
          {categories.map((category) => {
            const thumbnail = thumbnails[category.key]
            const imageSrc = thumbnail || '/placeholder-category.jpg'
            
            return (
              <Link
                key={category.name}
                href={category.href}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-primary-200 to-primary-300">
                  {thumbnail && !loading ? (
                    <img
                      src={thumbnail}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        // Fallback to gradient if image fails to load
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-300" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">{category.name}</h3>
                    <p className="text-xs sm:text-sm text-white mb-3">{category.description}</p>
                    <div className="flex items-center text-white font-semibold group-hover:translate-x-2 transition-transform text-sm sm:text-base">
                      Shop Now
                      <FiArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

