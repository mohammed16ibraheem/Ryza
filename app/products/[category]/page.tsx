'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FiShoppingCart, FiFilter } from 'react-icons/fi'

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

const categoryNames: { [key: string]: string } = {
  dresses: 'Dresses',
  hijabs: 'Hijabs',
  'gift-hampers': 'Gift Hampers',
  'hair-accessories': 'Hair Accessories',
  offers: 'Offers',
}

export default function CategoryPage() {
  const params = useParams()
  const category = params.category as string
  const [products, setProducts] = useState<Product[]>([])
  const [sortBy, setSortBy] = useState('default')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/products?category=${category}`)
        const data = await response.json()
        
        // Transform API products to match Product interface
        const transformedProducts = data.products.map((p: any) => ({
          id: p.id,
          name: p.name || p.title,
          price: p.price,
          image: p.images && p.images.length > 0 ? p.images[0] : '/placeholder.jpg',
          images: p.images,
          category: p.category.toLowerCase().replace(/\s+/g, '-'),
          description: p.description,
          discount: p.discount,
        }))
        
        setProducts(transformedProducts)
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category])

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price
    if (sortBy === 'price-high') return b.price - a.price
    return 0
  })

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    cart.push({ ...product, quantity: 1 })
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    alert(`${product.name} added to cart!`)
  }

  return (
    <div className="pt-20 md:pt-24 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {categoryNames[category] || 'Products'}
          </h1>
          <p className="text-gray-600">
            Discover our beautiful collection of {categoryNames[category]?.toLowerCase()}
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow lg:hidden"
          >
            <FiFilter className="w-5 h-5" />
            <span>Filters</span>
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="default">Sort by: Default</option>
            <option value="price-low">Sort by: Price Low to High</option>
            <option value="price-high">Sort by: Price High to Low</option>
          </select>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Loading products...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <Link href={`/products/${product.category}/${product.id}`}>
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.jpg'
                        }}
                      />
                      {product.discount && Number(product.discount) > 0 && (
                        <div className="absolute top-4 left-4 z-10">
                          <span className="inline-flex flex-col items-center justify-center bg-gradient-to-r from-red-500 via-pink-500 to-primary-600 text-white px-4 py-2 rounded-full shadow-lg transform hover:scale-110 transition-all duration-300 relative overflow-hidden group min-w-[90px]">
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                            <span className="relative z-10 flex flex-col items-center gap-0.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider leading-tight">DISCOUNT</span>
                              <span className="text-xs font-bold">{product.discount}% OFF</span>
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/products/${product.category}/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-1 hover:text-primary-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        {product.discount && Number(product.discount) > 0 ? (
                          <>
                            <div className="flex items-baseline gap-1 price-text text-gray-400">
                              <span className="currency text-sm">₹</span>
                              <span className="text-lg font-bold line-through">
                                {Math.floor(product.price).toLocaleString('en-IN')}
                              </span>
                              {product.price % 1 !== 0 && (
                                <span className="text-sm line-through">
                                  .{Math.round((product.price % 1) * 100).toString().padStart(2, '0')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-0.5 price-text text-gray-900">
                              <span className="currency text-lg text-gray-900">₹</span>
                              <span className="text-2xl font-bold text-gray-900">
                                {Math.floor(product.price * (1 - Number(product.discount) / 100)).toLocaleString('en-IN')}
                              </span>
                              {(product.price * (1 - Number(product.discount) / 100)) % 1 !== 0 && (
                                <span className="text-lg font-semibold text-gray-900">
                                  .{Math.round(((product.price * (1 - Number(product.discount) / 100)) % 1) * 100).toString().padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-baseline gap-0.5 price-text text-gray-900">
                            <span className="currency text-lg text-gray-900">₹</span>
                            <span className="text-2xl font-bold text-gray-900">
                              {Math.floor(product.price).toLocaleString('en-IN')}
                            </span>
                            {product.price % 1 !== 0 && (
                              <span className="text-lg font-semibold text-gray-900">
                                .{Math.round((product.price % 1) * 100).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 touch-manipulation min-h-[44px]"
                      >
                        <FiShoppingCart className="w-4 h-4" />
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {sortedProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No products found in this category.</p>
                <p className="text-gray-500 text-sm mt-2">Upload products from the admin panel to see them here.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

