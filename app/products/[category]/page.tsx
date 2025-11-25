'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { FiShoppingCart, FiCheck } from 'react-icons/fi'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  title?: string
  price: number
  image: string
  images?: string[]
  category: string
  subCategory?: string
  description: string
  discount?: string
}

const categoryNames: { [key: string]: string } = {
  'salah-essential': 'Salah Essential',
  dresses: 'Salah Essential', // Legacy support - map old "dresses" URL to "Salah Essential"
  hijabs: 'Hijabs',
  'gift-hampers': 'Gift Hampers',
  'hair-accessories': 'Hair Essentials',
  'hair-essentials': 'Hair Essentials',
  jewellery: 'Jewellery',
  offers: 'Offers',
}

// Sub-category mapping for Hijabs
const hijabSubCategories = [
  { label: 'All Hijabs', value: 'all', urlValue: '' },
  { label: 'Hijab Essentials', value: 'Accessory', urlValue: 'accessory' },
  { label: 'Luxury Hijabs', value: 'Luxury', urlValue: 'luxury' },
  { label: 'Day to Day Life', value: 'Day to Day Life', urlValue: 'day-to-day' },
]

// Map URL type parameter to subCategory value
const mapUrlTypeToSubCategory = (type: string | null): string | null => {
  if (!type) return null
  const mapping: { [key: string]: string } = {
    'accessory': 'Accessory',
    'luxury': 'Luxury',
    'day-to-day': 'Day to Day Life',
  }
  return mapping[type] || null
}

export default function CategoryPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const category = params.category as string
  const typeParam = searchParams.get('type')
  const selectedSubCategory = mapUrlTypeToSubCategory(typeParam)
  
  const [products, setProducts] = useState<Product[]>([])
  const [sortBy, setSortBy] = useState('default')
  const [loading, setLoading] = useState(true)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  // Handle notification visibility animation
  useEffect(() => {
    if (showNotification) {
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
    }
  }, [showNotification])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        // Map URL category to API category
        const categoryMap: { [key: string]: string } = {
          'salah-essential': 'Salah Essential',
          'dresses': 'Salah Essential', // Legacy support - map old "dresses" URL to "Salah Essential"
          'hijabs': 'Hijabs',
          'gift-hampers': 'Gift Hampers',
          'hair-accessories': 'Hair Essentials',
          'hair-essentials': 'Hair Essentials',
          'jewellery': 'Jewellery',
          'offers': 'Offers',
        }
        
        const apiCategory = categoryMap[category] || category
        const response = await fetch(`/api/products?category=${encodeURIComponent(apiCategory)}`)
        const data = await response.json()
        
        // Map database category to URL-friendly format
        const dbCategoryToUrl: { [key: string]: string } = {
          'Salah Essential': 'salah-essential',
          'Dresses': 'salah-essential', // Legacy support
          'Hijabs': 'hijabs',
          'Gift Hampers': 'gift-hampers',
          'Hair Essentials': 'hair-essentials',
          'Hair Accessories': 'hair-essentials',
          'Jewellery': 'jewellery',
          'Offers': 'offers',
        }
        
        // Transform API products to match Product interface
        let transformedProducts = data.products.map((p: any) => ({
          id: p.id,
          name: p.name || p.title,
          price: p.price,
          image: p.images && p.images.length > 0 ? p.images[0] : '/placeholder.jpg',
          images: p.images,
          category: dbCategoryToUrl[p.category] || p.category.toLowerCase().replace(/\s+/g, '-'),
          subCategory: p.subCategory,
          description: p.description,
          discount: p.discount,
        }))
        
        // Filter by sub-category if selected (for Hijabs)
        if (category === 'hijabs' && selectedSubCategory) {
          transformedProducts = transformedProducts.filter((p: Product) => 
            p.subCategory === selectedSubCategory
          )
        }
        
        setProducts(transformedProducts)
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category, selectedSubCategory])

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price
    if (sortBy === 'price-high') return b.price - a.price
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return 0
  })

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    // Ensure price is a number
    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0
    cart.push({ 
      ...product, 
      price: price, // Ensure price is always a number
      quantity: 1 
    })
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    
    // Show success notification
    setNotificationMessage(`${product.name} added to cart!`)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 7000)
  }

  const getSubCategoryUrl = (urlValue: string) => {
    if (!urlValue) return `/products/${category}`
    return `/products/${category}?type=${urlValue}`
  }

  return (
    <div className="pt-20 md:pt-24 min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {showNotification && (
        <div className={`fixed top-20 md:top-24 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}>
          <div className="mx-4 px-4 py-3 md:px-6 md:py-4 rounded-xl shadow-2xl border-2 flex items-center gap-3 md:gap-4 min-w-[280px] md:min-w-[380px] max-w-[90vw] backdrop-blur-sm bg-green-50/95 border-green-300 text-green-800">
            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-green-100">
              <FiCheck className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
            <p className="text-sm md:text-base font-semibold flex-1">
              {notificationMessage}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            {categoryNames[category] || 'Products'}
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Discover our beautiful collection of {categoryNames[category]?.toLowerCase()}
          </p>
        </div>

        {/* Sub-Category Filters (for Hijabs only) */}
        {category === 'hijabs' && (
          <div className="mb-6 md:mb-8">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {hijabSubCategories.map((subCat) => {
                const isActive = subCat.value === 'all' 
                  ? !selectedSubCategory 
                  : subCat.value === selectedSubCategory
                
                return (
                  <Link
                    key={subCat.value}
                    href={getSubCategoryUrl(subCat.urlValue)}
                    className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 min-h-[44px] flex items-center justify-center ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                  >
                    {subCat.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Sort Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <div className="text-sm text-gray-600">
            {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'} found
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-white rounded-lg shadow-sm border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
          >
            <option value="default">Sort by: Default</option>
            <option value="name">Sort by: Name A-Z</option>
            <option value="price-low">Sort by: Price Low to High</option>
            <option value="price-high">Sort by: Price High to Low</option>
          </select>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
            <p className="text-gray-600 text-lg">Loading products...</p>
          </div>
        ) : (
          <>
            {sortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                {sortedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  >
                    <Link href={`/products/${product.category}/${product.id}`}>
                      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.jpg'
                          }}
                        />
                        {product.discount && Number(product.discount) > 0 && (
                          <div className="absolute top-3 left-3 z-10">
                            <span className="inline-flex flex-col items-center justify-center bg-gradient-to-r from-red-500 via-pink-500 to-primary-600 text-white px-3 py-1.5 rounded-full shadow-lg text-xs font-bold">
                              {product.discount}% OFF
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-3 sm:p-4">
                      <Link href={`/products/${product.category}/${product.id}`}>
                        <h3 className="font-semibold text-gray-900 mb-1.5 hover:text-primary-600 transition-colors text-sm sm:text-base line-clamp-2 min-h-[2.5rem]">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2 hidden sm:block">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          {product.discount && Number(product.discount) > 0 ? (
                            <>
                              <div className="flex items-baseline gap-0.5 price-text text-gray-400">
                                <span className="currency text-xs">₹</span>
                                <span className="text-sm font-bold line-through">
                                  {Math.floor(product.price).toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-0.5 price-text text-gray-900">
                                <span className="currency text-base sm:text-lg text-gray-900">₹</span>
                                <span className="text-lg sm:text-xl font-bold text-gray-900">
                                  {Math.floor(product.price * (1 - Number(product.discount) / 100)).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-baseline gap-0.5 price-text text-gray-900">
                              <span className="currency text-base sm:text-lg text-gray-900">₹</span>
                              <span className="text-lg sm:text-xl font-bold text-gray-900">
                                {Math.floor(product.price).toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-1 sm:space-x-2 touch-manipulation min-h-[44px] text-sm sm:text-base"
                          aria-label="Add to cart"
                        >
                          <FiShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="hidden sm:inline">Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg mb-2">No products found in this category.</p>
                <p className="text-gray-500 text-sm">Upload products from the admin panel to see them here.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
