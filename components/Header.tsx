'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FiMenu, FiX, FiShoppingCart, FiSearch, FiChevronDown, FiX as FiClose } from 'react-icons/fi'

interface Product {
  id: string
  name: string
  title?: string
  category: string
  description?: string
  price: number
  images?: string[]
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isHijabsDropdownOpen, setIsHijabsDropdownOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const updateCartCount = () => {
    const cart = localStorage.getItem('cart')
    if (cart) {
      const cartItems = JSON.parse(cart)
      setCartCount(cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0))
    } else {
      setCartCount(0)
    }
  }

  useEffect(() => {
    updateCartCount()
    
    const handleCartUpdate = () => {
      updateCartCount()
    }
    
    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => window.removeEventListener('cartUpdated', handleCartUpdate)
  }, [])

  // Fetch all products for search
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        const data = await response.json()
        setAllProducts(data.products || [])
      } catch (error) {
        console.error('Error fetching products for search:', error)
      }
    }
    fetchProducts()
  }, [])

  // Search functionality - incremental search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    const query = searchQuery.toLowerCase().trim()

    // Filter products that match the search query
    // Search in: name, title, description, category
    const filtered = allProducts.filter((product) => {
      const name = (product.name || product.title || '').toLowerCase()
      const description = (product.description || '').toLowerCase()
      const category = (product.category || '').toLowerCase()

      // Check if query matches the beginning of any searchable field
      return (
        name.startsWith(query) ||
        description.includes(query) ||
        category.startsWith(query) ||
        name.includes(query)
      )
    })

    // Sort results: exact matches first, then partial matches
    const sorted = filtered.sort((a, b) => {
      const aName = (a.name || a.title || '').toLowerCase()
      const bName = (b.name || b.title || '').toLowerCase()
      
      if (aName.startsWith(query) && !bName.startsWith(query)) return -1
      if (!aName.startsWith(query) && bName.startsWith(query)) return 1
      return aName.localeCompare(bName)
    })

    setSearchResults(sorted.slice(0, 8)) // Limit to 8 results
    setIsLoading(false)
  }, [searchQuery, allProducts])

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false)
        setSearchQuery('')
      }
    }

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSearchOpen])

  // Focus search input when opened and prevent body scroll on mobile
  useEffect(() => {
    if (isSearchOpen) {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
      // Prevent body scroll on mobile when search is open
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSearchOpen])

  const handleSearchClick = () => {
    setIsSearchOpen(true)
  }

  const handleProductClick = (product: Product) => {
    // Map category to URL
    const categoryMap: { [key: string]: string } = {
      'Salah Essential': 'salah-essential',
      'Hijabs': 'hijabs',
      'Gift Hampers': 'gift-hampers',
      'Hair Essentials': 'hair-essentials',
      'Jewellery': 'jewellery',
      'Offers': 'offers',
    }
    
    const categorySlug = categoryMap[product.category] || product.category.toLowerCase().replace(/\s+/g, '-')
    router.push(`/products/${categorySlug}/${product.id}`)
    setIsSearchOpen(false)
    setSearchQuery('')
  }

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Salah Essential', href: '/products/dresses' },
    { name: 'Hijabs', href: '/products/hijabs' },
    { name: 'Gift Hampers', href: '/products/gift-hampers' },
    { name: 'Hair Essentials', href: '/products/hair-accessories' },
    { name: 'Jewellery', href: '/products/jewellery' },
    { name: 'Offers', href: '/offers' },
  ]

  return (
    <Fragment>
      {/* Search Backdrop - Only on Desktop */}
      {isSearchOpen && (
        <div 
          className="hidden sm:block fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => {
            setIsSearchOpen(false)
            setSearchQuery('')
          }}
        />
      )}

    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-md'
          : 'bg-white/95 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 touch-manipulation group hover:opacity-90 transition-opacity ml-6 sm:ml-8 md:ml-10">
            <div className="relative flex-shrink-0 self-center -mt-1 sm:-mt-1.5 md:-mt-2">
              <Image
                src="/logo.png"
                alt="Ryza Logo"
                width={64}
                height={64}
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
                style={{ 
                  backgroundColor: 'transparent',
                  filter: 'brightness(0.7) contrast(1.5) saturate(1.3)'
                }}
                priority
              />
            </div>
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-600">
              Ryza
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 pt-1">
            {navLinks.map((link) => {
              if (link.name === 'Hijabs') {
                return (
                  <div
                    key={link.name}
                    className="relative"
                    onMouseEnter={() => setIsHijabsDropdownOpen(true)}
                    onMouseLeave={() => setIsHijabsDropdownOpen(false)}
                  >
                    <div className="flex items-center space-x-1 group">
                      <Link href={link.href} className="text-gray-700 hover:text-primary-600 transition-colors font-medium text-lg">
                        {link.name}
                      </Link>
                      <FiChevronDown className={`w-4 h-4 text-gray-500 group-hover:text-primary-600 transition-all duration-200 ${isHijabsDropdownOpen ? 'rotate-180 text-primary-600' : ''}`} />
                    </div>
                    {isHijabsDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-2xl border border-gray-200 py-2 z-50 animate-fade-in-dropdown">
                        <div className="px-2">
                          <Link
                            href="/products/hijabs?type=accessory"
                            className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-md transition-all duration-150 font-medium"
                          >
                            <span className="flex-1">Hijab Essentials</span>
                            <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                          <Link
                            href="/products/hijabs?type=luxury"
                            className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-md transition-all duration-150 font-medium"
                          >
                            <span className="flex-1">Luxury Hijabs</span>
                            <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        <Link
                            href="/products/hijabs?type=day-to-day"
                            className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-md transition-all duration-150 font-medium"
                        >
                            <span className="flex-1">Day to Day Life</span>
                            <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium text-lg"
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {/* Search Button and Dropdown */}
            <div className="relative">
              <button 
                onClick={handleSearchClick}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 text-gray-700 hover:text-primary-600 transition-colors touch-manipulation"
                aria-label="Search"
              >
                <FiSearch className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Search Dropdown - Mobile Optimized */}
              {isSearchOpen && (
                <div 
                  ref={searchDropdownRef}
                  className="fixed sm:absolute top-0 sm:top-full left-0 sm:left-auto right-0 sm:right-0 mt-0 sm:mt-2 w-full sm:w-80 md:w-96 h-screen sm:h-auto sm:max-h-[calc(100vh-2rem)] bg-white sm:rounded-xl shadow-2xl border-0 sm:border border-gray-200 z-[60] overflow-hidden"
                >
                  {/* Mobile Header with Close Button */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 sm:hidden">
                    <h3 className="text-lg font-semibold text-gray-900">Search Products</h3>
                    <button
                      onClick={() => {
                        setIsSearchOpen(false)
                        setSearchQuery('')
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors touch-manipulation"
                      aria-label="Close search"
                    >
                      <FiClose className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="p-3 sm:p-4 border-b border-gray-200">
                    <div className="relative">
                      <FiSearch className="absolute left-3 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 sm:w-5 sm:h-5" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setIsSearchOpen(false)
                            setSearchQuery('')
                          } else if (e.key === 'Enter' && searchResults.length > 0) {
                            handleProductClick(searchResults[0])
                          }
                        }}
                        placeholder="Search products..."
                        className="w-full pl-10 pr-10 py-3 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base sm:text-sm touch-manipulation"
                        autoComplete="off"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery('')
                            searchInputRef.current?.focus()
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 touch-manipulation"
                          aria-label="Clear search"
                        >
                          <FiClose className="w-5 h-5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search Results - Mobile Optimized */}
                  <div className="max-h-[calc(100vh-180px)] sm:max-h-96 overflow-y-auto overscroll-contain">
                    {isLoading ? (
                      <div className="p-8 sm:p-8 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto mb-2"></div>
                        <p className="text-sm sm:text-sm">Searching...</p>
                      </div>
                    ) : searchQuery.trim() && searchResults.length === 0 ? (
                      <div className="p-8 sm:p-8 text-center text-gray-500">
                        <FiSearch className="w-12 h-12 sm:w-8 sm:h-8 mx-auto mb-3 sm:mb-2 text-gray-300" />
                        <p className="text-base sm:text-sm font-medium">No products found</p>
                        <p className="text-sm sm:text-xs mt-2 sm:mt-1 text-gray-400">Try a different search term</p>
                      </div>
                    ) : !searchQuery.trim() ? (
                      <div className="p-8 sm:p-8 text-center text-gray-500">
                        <FiSearch className="w-12 h-12 sm:w-8 sm:h-8 mx-auto mb-3 sm:mb-2 text-gray-300" />
                        <p className="text-base sm:text-sm">Start typing to search products</p>
                        <p className="text-sm sm:text-xs mt-2 sm:mt-1 text-gray-400">Search by name, category, or description</p>
                      </div>
                    ) : (
                      <div className="py-1 sm:py-2">
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            className="w-full px-4 sm:px-4 py-4 sm:py-3 active:bg-gray-100 sm:hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0 group touch-manipulation"
                          >
                            <div className="flex items-start gap-3 sm:gap-3">
                              {/* Product Image - Larger on Mobile */}
                              {product.images && product.images.length > 0 && (
                                <div className="flex-shrink-0 w-16 h-16 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                                  <img
                                    src={product.images[0]}
                                    alt={product.name || product.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              
                              {/* Product Info - Better Mobile Typography */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-base sm:text-sm group-active:text-primary-600 sm:group-hover:text-primary-600 transition-colors line-clamp-2 sm:truncate">
                                  {product.name || product.title}
                                </h4>
                                <p className="text-sm sm:text-xs text-gray-500 mt-1 sm:mt-0.5">{product.category}</p>
                                <p className="text-base sm:text-sm font-bold text-primary-600 mt-1.5 sm:mt-1">
                                  ₹{product.price.toLocaleString()}
                                </p>
                              </div>
                              
                              {/* Arrow Icon - Larger on Mobile */}
                              <div className="flex-shrink-0 text-gray-400 group-active:text-primary-600 sm:group-hover:text-primary-600 transition-colors flex items-center">
                                <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
            </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/cart"
              className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 text-gray-700 hover:text-primary-600 transition-colors touch-manipulation"
              aria-label="Shopping Cart"
            >
              <FiShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-primary-600 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 text-gray-700 hover:text-primary-600 transition-colors touch-manipulation"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? (
                <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <FiMenu className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-4 space-y-3">
            {navLinks.map((link) => {
              if (link.name === 'Hijabs') {
                return (
                  <div key={link.name} className="border-b border-gray-100 last:border-b-0 pb-2 mb-2 last:mb-0">
                    <div className="flex items-center justify-between">
                      <Link 
                        href={link.href} 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex-1 text-gray-700 hover:text-primary-600 transition-colors font-medium py-2.5 text-lg"
                      >
                        {link.name}
                      </Link>
                    <button
                      onClick={() => setIsHijabsDropdownOpen(!isHijabsDropdownOpen)}
                        className="p-2 -mr-2 text-gray-500 hover:text-primary-600 transition-all duration-200 rounded-md hover:bg-gray-50"
                        aria-label="Toggle dropdown"
                    >
                        <FiChevronDown className={`w-5 h-5 transition-transform duration-200 ${isHijabsDropdownOpen ? 'rotate-180 text-primary-600' : ''}`} />
                    </button>
                    </div>
                    {isHijabsDropdownOpen && (
                      <div className="pl-4 mt-2 space-y-1 animate-fade-in-dropdown">
                        <Link
                          href="/products/hijabs?type=accessory"
                          onClick={() => {
                            setIsMenuOpen(false)
                            setIsHijabsDropdownOpen(false)
                          }}
                          className="flex items-center justify-between px-3 py-2.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-all duration-150 font-medium"
                        >
                          <span>Hijab Essentials</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                        <Link
                          href="/products/hijabs?type=luxury"
                          onClick={() => {
                            setIsMenuOpen(false)
                            setIsHijabsDropdownOpen(false)
                          }}
                          className="flex items-center justify-between px-3 py-2.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-all duration-150 font-medium"
                        >
                          <span>Luxury Hijabs</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                        <Link
                          href="/products/hijabs?type=day-to-day"
                          onClick={() => {
                            setIsMenuOpen(false)
                            setIsHijabsDropdownOpen(false)
                          }}
                          className="flex items-center justify-between px-3 py-2.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-all duration-150 font-medium"
                        >
                          <span>Day to Day Life</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-gray-700 hover:text-primary-600 transition-colors font-medium py-2 text-lg"
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
    </Fragment>
  )
}

