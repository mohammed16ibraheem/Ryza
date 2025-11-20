'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiShoppingCart, FiTrash2, FiMinus, FiPlus, FiArrowLeft } from 'react-icons/fi'

interface CartItem {
  id: number
  name: string
  price: number
  image: string
  quantity: number
  selectedSize?: string
  selectedColor?: string
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartUpdated, setCartUpdated] = useState(0)

  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        // Group items by id, size, and color
        const items = JSON.parse(savedCart)
        const grouped: { [key: string]: CartItem } = {}
        
        items.forEach((item: CartItem) => {
          const key = `${item.id}-${item.selectedSize || ''}-${item.selectedColor || ''}`
          if (grouped[key]) {
            grouped[key].quantity += 1
          } else {
            grouped[key] = { ...item, quantity: 1 }
          }
        })
        
        setCart(Object.values(grouped))
      }
    }

    loadCart()

    const handleCartUpdate = () => {
      setCartUpdated((prev) => prev + 1)
      loadCart()
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => window.removeEventListener('cartUpdated', handleCartUpdate)
  }, [cartUpdated])

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    const updatedCart = [...cart]
    updatedCart[index].quantity = newQuantity
    setCart(updatedCart)
    
    // Update localStorage
    const allItems: CartItem[] = []
    updatedCart.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        allItems.push({ ...item, quantity: 1 })
      }
    })
    localStorage.setItem('cart', JSON.stringify(allItems))
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const removeItem = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index)
    setCart(updatedCart)
    
    // Update localStorage
    const allItems: CartItem[] = []
    updatedCart.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        allItems.push({ ...item, quantity: 1 })
      }
    })
    localStorage.setItem('cart', JSON.stringify(allItems))
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 5000 ? 0 : 200
  const total = subtotal + shipping

  if (cart.length === 0) {
    return (
      <div className="pt-20 md:pt-24 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <FiShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Start shopping to add items to your cart</p>
            <Link
              href="/products"
              className="inline-block px-8 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-20 md:pt-24 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Continue Shopping
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="bg-white rounded-xl shadow-md p-4 md:p-6 flex flex-col sm:flex-row gap-4"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full sm:w-32 h-48 sm:h-32 object-cover rounded-lg"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                  {item.selectedSize && (
                    <p className="text-sm text-gray-600 mb-1">Size: {item.selectedSize}</p>
                  )}
                  {item.selectedColor && (
                    <p className="text-sm text-gray-600 mb-1">Color: {item.selectedColor}</p>
                  )}
                  <div className="flex items-baseline gap-0.5 mb-4 price-text text-gray-900">
                    <span className="currency text-lg text-gray-900">₹</span>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.floor(item.price).toLocaleString('en-IN')}
                    </p>
                    {item.price % 1 !== 0 && (
                      <span className="text-lg font-semibold text-gray-900">
                        .{Math.round((item.price % 1) * 100).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-semibold w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-baseline text-gray-600">
                  <span>Subtotal</span>
                  <div className="flex items-baseline gap-0.5 price-text text-gray-900">
                    <span className="currency text-sm text-gray-900">₹</span>
                    <span className="text-lg font-semibold text-gray-900">{Math.floor(subtotal).toLocaleString('en-IN')}</span>
                    {subtotal % 1 !== 0 && (
                      <span className="text-sm font-semibold text-gray-900">.{Math.round((subtotal % 1) * 100).toString().padStart(2, '0')}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-baseline text-gray-600">
                  <span>Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-sm font-semibold text-green-600">Free</span>
                  ) : (
                    <div className="flex items-baseline gap-0.5 price-text text-gray-900">
                      <span className="currency text-sm text-gray-900">₹</span>
                      <span className="text-lg font-semibold text-gray-900">{Math.floor(shipping).toLocaleString('en-IN')}</span>
                      {shipping % 1 !== 0 && (
                        <span className="text-sm font-semibold text-gray-900">.{Math.round((shipping % 1) * 100).toString().padStart(2, '0')}</span>
                      )}
                    </div>
                  )}
                </div>
                {subtotal < 5000 && (
                  <p className="text-sm text-primary-600">
                    Add ₹{Math.floor(5000 - subtotal).toLocaleString('en-IN')} more for free shipping!
                  </p>
                )}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-baseline text-xl font-bold text-gray-900">
                    <span className="tracking-tight">Total</span>
                    <div className="flex items-baseline gap-1 price-text text-gray-900">
                      <span className="currency text-lg text-gray-900">₹</span>
                      <span className="text-3xl font-bold text-gray-900">{Math.floor(total).toLocaleString('en-IN')}</span>
                      {total % 1 !== 0 && (
                        <span className="text-lg font-semibold text-gray-900">.{Math.round((total % 1) * 100).toString().padStart(2, '0')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button className="w-full py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors mb-4 touch-manipulation min-h-[44px]">
                Proceed to Checkout
              </button>
              <Link
                href="/products"
                className="block text-center text-primary-600 hover:text-primary-700 font-semibold"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

