'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiShoppingCart } from 'react-icons/fi'

interface Product {
  id: string
  name: string
  price: number
  image: string
  images?: string[]
  category: string
  description: string
  discount?: string
  outOfStockImages?: number[]
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products')
        const data = await response.json()
        
        // Transform and limit to 8 featured products
        const transformedProducts = data.products.slice(0, 8).map((p: any) => ({
          id: p.id,
          name: p.name || p.title,
          price: p.price,
          image: p.images && p.images.length > 0 ? p.images[0] : '/placeholder.jpg',
          images: p.images,
          category: p.category.toLowerCase().replace(/\s+/g, '-'),
          description: p.description,
          discount: p.discount,
          outOfStockImages: p.outOfStockImages || [],
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
  }, [])

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    }
    cart.push(cartItem)
    localStorage.setItem('cart', JSON.stringify(cart))
    
    // Trigger cart update event
    window.dispatchEvent(new Event('cartUpdated'))
    
    // Show notification
    alert(`${product.name} added to cart!`)
  }

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Handpicked favorites from our collection
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading featured products...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {products.map((product) => (
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
                    {/* Out of Stock Badge */}
                    {product.outOfStockImages && product.outOfStockImages.includes(0) && (
                      <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center z-10 pointer-events-none">
                        <div className="bg-red-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-bold text-sm sm:text-lg shadow-2xl border-2 border-white pointer-events-none">
                          OUT OF STOCK
                        </div>
                      </div>
                    )}
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
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No products available yet.</p>
            <p className="text-gray-500 text-sm mt-2">Upload products from the admin panel to see them here.</p>
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-block px-8 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition-colors"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}

