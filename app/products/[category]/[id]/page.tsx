'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FiShoppingCart, FiArrowLeft, FiMinus, FiPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

interface ColorVariant {
  color: string
  images: string[]
}

interface Product {
  id: string
  name: string
  title?: string
  price: number
  image: string
  images?: string[]
  category: string
  description: string
  details?: string
  discount?: string
  weight?: string
  video?: string
  sizes?: string[] // Available sizes for the product
  colorVariants?: ColorVariant[]
  imageColors?: string[] // Color names for each image
  outOfStockImages?: number[] // Array of image indices that are out of stock
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const category = params.category as string
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/products?category=${category}`)
        const data = await response.json()
        
        const foundProduct = data.products.find((p: any) => p.id === productId)
        
        if (foundProduct) {
                      const transformedProduct: Product = {
                        id: foundProduct.id,
                        name: foundProduct.name || foundProduct.title,
                        price: foundProduct.price,
                        image: foundProduct.images && foundProduct.images.length > 0 ? foundProduct.images[0] : '/placeholder.jpg',
                        images: foundProduct.images,
                        category: foundProduct.category.toLowerCase().replace(/\s+/g, '-'),
                        description: foundProduct.description,
                        details: foundProduct.description, // Use description as details if no separate details field
                        discount: foundProduct.discount,
                        weight: foundProduct.weight,
                        video: foundProduct.video,
                        colorVariants: foundProduct.colorVariants,
                        imageColors: foundProduct.imageColors || [],
                        outOfStockImages: foundProduct.outOfStockImages || [],
                      }
          setProduct(transformedProduct)
          // Set first color as selected if color variants exist
          if (foundProduct.colorVariants && foundProduct.colorVariants.length > 0) {
            setSelectedColor(foundProduct.colorVariants[0].color)
          }
        } else {
          setProduct(null)
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId, category])

  // Reset image index when color changes
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [selectedColor])

  // Get current images based on selected color
  const getCurrentImages = (): string[] => {
    if (product?.colorVariants && selectedColor) {
      const variant = product.colorVariants.find(v => v.color.toLowerCase() === selectedColor.toLowerCase())
      if (variant && variant.images.length > 0) {
        return variant.images
      }
    }
    return product?.images || []
  }

  const currentImages = getCurrentImages()

  // Check if current image is out of stock
  const isCurrentImageOutOfStock = product?.outOfStockImages?.includes(currentImageIndex) || false

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && currentImageIndex < currentImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
    if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  if (loading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <Link href={`/products/${category}`} className="text-primary-600 hover:underline">
            Back to {category}
          </Link>
        </div>
      </div>
    )
  }

  const addToCart = () => {
    // Prevent adding to cart if current image is out of stock
    if (isCurrentImageOutOfStock) {
      alert('This item is currently out of stock. Please select a different variant.')
      return
    }
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    for (let i = 0; i < quantity; i++) {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: currentImages[0] || product.image,
        quantity: 1,
        selectedSize,
        selectedColor,
      })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    alert(`${quantity} ${product.name} (${selectedColor || 'Default'}) added to cart!`)
  }

  return (
    <div className="pt-20 md:pt-24 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/products/${product.category}`}
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to {product.category}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Product Image Carousel */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {currentImages.length > 0 ? (
              <div 
                className="relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={currentImages[currentImageIndex]}
                    alt={`${product.name} - ${selectedColor || 'Image'} ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.jpg'
                    }}
                  />
                  
                  {/* Out of Stock Badge */}
                  {product.outOfStockImages && product.outOfStockImages.includes(currentImageIndex) && (
                    <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center z-10 pointer-events-none">
                      <div className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-2xl border-2 border-white pointer-events-none">
                        OUT OF STOCK
                      </div>
                    </div>
                  )}
                  
                  {/* Navigation Arrows */}
                  {currentImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                        disabled={currentImageIndex === 0}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all z-20"
                        aria-label="Previous image"
                      >
                        <FiChevronLeft className="w-6 h-6 text-gray-800" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex(Math.min(currentImages.length - 1, currentImageIndex + 1))}
                        disabled={currentImageIndex === currentImages.length - 1}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all z-20"
                        aria-label="Next image"
                      >
                        <FiChevronRight className="w-6 h-6 text-gray-800" />
                      </button>
                    </>
                  )}
                </div>
                
                {/* Image Indicators */}
                {currentImages.length > 1 && (
                  <div className="flex justify-center gap-2 p-4">
                    {currentImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-1.5 sm:h-2 rounded-full transition-all ${
                          index === currentImageIndex ? 'bg-primary-600 w-8' : 'bg-gray-300 w-1.5 sm:w-2'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
                
                {/* Color Swatches - Classic Small Dots */}
                {product.imageColors && product.imageColors.length > 0 && (
                  <div className="flex justify-center items-center gap-2.5 sm:gap-3 px-4 pb-4">
                    {product.imageColors.map((colorName, index) => {
                      // Extract color from color name or use a default
                      const getColorFromName = (name: string): string => {
                        const colorMap: { [key: string]: string } = {
                          'black': '#000000',
                          'blue': '#3B82F6',
                          'brown': '#8B4513',
                          'green': '#10B981',
                          'red': '#EF4444',
                          'white': '#FFFFFF',
                          'gray': '#6B7280',
                          'grey': '#6B7280',
                          'purple': '#92487A',
                          'pink': '#EC4899',
                          'yellow': '#FBBF24',
                          'orange': '#F97316',
                          'navy': '#1E3A8A',
                          'beige': '#F5F5DC',
                          'light': '#F3F4F6',
                          'dark': '#1F2937',
                        }
                        
                        const lowerName = name.toLowerCase()
                        for (const [key, value] of Object.entries(colorMap)) {
                          if (lowerName.includes(key)) {
                            return value
                          }
                        }
                        return '#92487A' // Default to primary color
                      }
                      
                      const colorValue = getColorFromName(colorName)
                      const isActive = index === currentImageIndex
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative transition-all duration-200 ${
                            isActive ? 'scale-110' : 'hover:scale-105'
                          }`}
                          aria-label={`Color: ${colorName}`}
                          title={colorName}
                        >
                          <div
                            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 transition-all ${
                              isActive 
                                ? 'border-primary-600 shadow-md shadow-primary-600/50' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: colorValue }}
                          />
                          {isActive && (
                            <div className="absolute inset-0 rounded-full border-2 border-primary-600 animate-pulse" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.jpg'
                  }}
                />
              </div>
            )}
            
            {product.video && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <video 
                  controls 
                  muted
                  playsInline
                  className="w-full rounded-xl"
                  preload="metadata"
                >
                  <source src={product.video} type="video/webm" />
                  <source src={product.video} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <p className="text-xs text-gray-500 mt-2 text-center">Video is muted by default</p>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              {product.discount && Number(product.discount) > 0 ? (
                <div className="flex items-baseline gap-4 flex-wrap">
                  <div className="flex items-baseline gap-1 price-text text-gray-400">
                    <span className="currency text-xl">₹</span>
                    <p className="text-3xl font-bold line-through">
                      {Math.floor(product.price).toLocaleString('en-IN')}
                    </p>
                    {product.price % 1 !== 0 && (
                      <span className="text-xl line-through">
                        .{Math.round((product.price % 1) * 100).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 price-text text-gray-900">
                    <span className="currency text-2xl text-gray-900">₹</span>
                    <p className="text-4xl font-bold text-gray-900">
                      {Math.floor(product.price * (1 - Number(product.discount) / 100)).toLocaleString('en-IN')}
                    </p>
                    {(product.price * (1 - Number(product.discount) / 100)) % 1 !== 0 && (
                      <span className="text-2xl font-semibold text-gray-900">
                        .{Math.round(((product.price * (1 - Number(product.discount) / 100)) % 1) * 100).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex flex-col items-center justify-center bg-gradient-to-r from-red-500 via-pink-500 to-primary-600 text-white px-6 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 relative overflow-hidden group min-w-[110px]">
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                    <span className="relative z-10 flex flex-col items-center gap-1">
                      <span className="text-xs font-extrabold uppercase tracking-wider leading-tight">DISCOUNT</span>
                      <span className="text-sm font-bold">{product.discount}% OFF</span>
                    </span>
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1 price-text text-gray-900">
                  <span className="currency text-2xl text-gray-900">₹</span>
                  <p className="text-4xl font-bold text-gray-900">
                    {Math.floor(product.price).toLocaleString('en-IN')}
                  </p>
                  {product.price % 1 !== 0 && (
                    <span className="text-2xl font-semibold text-gray-900">
                      .{Math.round((product.price % 1) * 100).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              )}
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              {product.description}
            </p>

            {product.details && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Details</h3>
                <p className="text-gray-600 leading-relaxed">{product.details}</p>
              </div>
            )}

            {product.weight && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Weight</h3>
                <p className="text-gray-600 font-medium">{product.weight}</p>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Size</h3>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        selectedSize === size
                          ? 'border-primary-600 bg-primary-50 text-primary-600'
                          : 'border-gray-300 hover:border-primary-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Display - Show color name for current image */}
            {product.imageColors && product.imageColors.length > 0 && product.imageColors[currentImageIndex] && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Color</h3>
                <p className="text-gray-800 font-medium capitalize">
                  {product.imageColors[currentImageIndex]}
                </p>
              </div>
            )}

            {/* Color Variants Selection - Fallback if no imageColors */}
            {(!product.imageColors || product.imageColors.length === 0 || !product.imageColors[currentImageIndex]) && product.colorVariants && product.colorVariants.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Color</h3>
                <div className="flex flex-wrap gap-3">
                  {product.colorVariants.map((variant) => (
                    <button
                      key={variant.color}
                      onClick={() => setSelectedColor(variant.color)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all capitalize ${
                        selectedColor.toLowerCase() === variant.color.toLowerCase()
                          ? 'border-primary-600 bg-primary-50 text-primary-600 ring-2 ring-primary-200'
                          : 'border-gray-300 hover:border-primary-300 text-gray-700'
                      }`}
                    >
                      {variant.color}
                    </button>
                  ))}
                </div>
                {selectedColor && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: <span className="font-semibold capitalize">{selectedColor}</span>
                  </p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FiMinus className="w-5 h-5" />
                </button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FiPlus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Out of Stock Message */}
            {isCurrentImageOutOfStock && (
              <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <p className="text-red-700 font-semibold text-center">
                  Product is out of stock
                </p>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={addToCart}
              disabled={isCurrentImageOutOfStock}
              className={`w-full py-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 mb-4 touch-manipulation min-h-[44px] ${
                isCurrentImageOutOfStock
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              <FiShoppingCart className="w-5 h-5" />
              <span>{isCurrentImageOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}

