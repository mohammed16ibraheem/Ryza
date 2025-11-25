'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiShoppingCart, FiFilter, FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  title?: string
  price: number
  image: string
  images?: string[]
  category: string
  description: string
  discount?: string
}

const ITEMS_PER_PAGE = 12

export default function AllProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [sortBy, setSortBy] = useState('default')
  const [currentPage, setCurrentPage] = useState(1)
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
        // Fetch all products without category filter
        const response = await fetch('/api/products')
        const data = await response.json()
        
        // Transform API products to match Product interface
        const transformedProducts = data.products.map((p: any) => {
          // Map category names to URL-friendly format
          const categoryMap: { [key: string]: string } = {
            'Salah Essential': 'salah-essential',
            'Dresses': 'salah-essential', // Legacy support - map old "Dresses" to "salah-essential"
            'Hijabs': 'hijabs',
            'Gift Hampers': 'gift-hampers',
            'Hair Essentials': 'hair-essentials',
            'Hair Accessories': 'hair-essentials',
            'Jewellery': 'jewellery',
            'Offers': 'offers',
          }
          
          return {
            id: p.id,
            name: p.name || p.title,
            price: p.price,
            image: p.images && p.images.length > 0 ? p.images[0] : '/placeholder.jpg',
            images: p.images,
            category: categoryMap[p.category] || p.category.toLowerCase().replace(/\s+/g, '-'),
            description: p.description,
            discount: p.discount,
          }
        })
        
        setProducts(transformedProducts)
        setCurrentPage(1) // Reset to first page when products change
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price
    if (sortBy === 'price-high') return b.price - a.price
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return 0
  })

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex)

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    cart.push({ ...product, quantity: 1 })
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    
    // Show success notification
    setNotificationMessage(`${product.name} added to cart!`)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 7000)
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
            All Products
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Discover our complete collection of {products.length}+ products
          </p>
        </div>

        {/* Sort and Info Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, sortedProducts.length)} of {sortedProducts.length} products
          </div>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              setCurrentPage(1)
            }}
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
            {paginatedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                  {paginatedProducts.map((product) => (
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 md:mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] flex items-center gap-2"
                        aria-label="Previous page"
                      >
                        <FiChevronLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Previous</span>
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 sm:px-4 py-2 rounded-lg min-w-[44px] min-h-[44px] transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                              }`}
                              aria-label={`Page ${pageNum}`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] flex items-center gap-2"
                        aria-label="Next page"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <FiChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg mb-2">No products found.</p>
                <p className="text-gray-500 text-sm">Upload products from the admin panel to see them here.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
