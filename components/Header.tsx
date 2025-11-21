'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FiMenu, FiX, FiShoppingCart, FiSearch, FiUser, FiChevronDown } from 'react-icons/fi'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isHijabsDropdownOpen, setIsHijabsDropdownOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)

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
          <Link href="/" className="relative flex items-center justify-center touch-manipulation group hover:opacity-90 transition-opacity">
            <div className="relative flex items-center justify-center">
              {/* Logo Image Behind Text */}
              <div className="absolute inset-0 flex items-center justify-center">
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
              {/* Text Over Logo */}
              <span className="relative text-xl sm:text-2xl md:text-3xl font-bold text-primary-600 z-10">
                Ryza
              </span>
            </div>
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
                      <Link href={link.href} className="text-gray-700 hover:text-primary-600 transition-colors font-medium text-base">
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
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium text-base"
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <button 
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 text-gray-700 hover:text-primary-600 transition-colors touch-manipulation"
              aria-label="Search"
            >
              <FiSearch className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
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
            <button 
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 text-gray-700 hover:text-primary-600 transition-colors touch-manipulation"
              aria-label="User Account"
            >
              <FiUser className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

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
                        className="flex-1 text-gray-700 hover:text-primary-600 transition-colors font-medium py-2.5 text-base"
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
                  className="block text-gray-700 hover:text-primary-600 transition-colors font-medium py-2"
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}

