'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiArrowLeft, FiMapPin, FiNavigation } from 'react-icons/fi'

interface CartItem {
  id: number
  name: string
  price: number
  image: string
  quantity: number
  selectedSize?: string
  selectedColor?: string
  selectedImageIndex?: number
}

interface ShippingInfo {
  firstName: string
  lastName: string
  address: string
  location: string
  mobileNumber: string
  landmark: string
  pinCode: string
}

// Generate unique order ID helper (browser-safe)
function generateOrderId(): string {
  const timestamp = Date.now()
  const random1 = Math.random().toString(36).substring(2, 11)
  const random2 = Math.random().toString(36).substring(2, 11)
  const performanceId = typeof performance !== 'undefined' && performance.now ? Math.floor(performance.now() * 1000).toString(36) : ''
  return `ORDER_${timestamp}_${random1}_${random2}${performanceId ? '_' + performanceId : ''}`
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: 0,
  })
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [formData, setFormData] = useState<ShippingInfo>({
    firstName: '',
    lastName: '',
    address: '',
    location: '',
    mobileNumber: '',
    landmark: '',
    pinCode: '',
  })
  const [errors, setErrors] = useState<Partial<ShippingInfo>>({})
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showPaymentInfo, setShowPaymentInfo] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const router = useRouter()
  const BASE_SHIPPING_COST = 200

  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const items = JSON.parse(savedCart)
        const grouped: { [key: string]: CartItem } = {}
        
        items.forEach((item: CartItem) => {
          const key = `${item.id}-${item.selectedSize || ''}-${item.selectedColor || ''}-${item.selectedImageIndex !== undefined ? item.selectedImageIndex : ''}`
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

    // Fetch shipping settings
    const fetchShippingSettings = async () => {
      try {
        const timestamp = Date.now()
        const response = await fetch(`/api/shipping-settings?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.freeShippingThreshold !== undefined) {
            const threshold = typeof data.freeShippingThreshold === 'number' 
              ? data.freeShippingThreshold 
              : parseFloat(data.freeShippingThreshold) || 0
            
            setShippingSettings({
              freeShippingThreshold: threshold,
            })
          }
        }
      } catch (error) {
        console.error('Error fetching shipping settings:', error)
      }
    }

    fetchShippingSettings()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (errors[name as keyof ShippingInfo]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsLoadingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          
          // Use reverse geocoding API to get address details
          // Using OpenStreetMap Nominatim API (free, no API key needed)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'Ryza E-commerce App',
              },
            }
          )
          
          const data = await response.json()
          
          if (data && data.address) {
            const address = data.address
            
            // Extract location/city
            const location = 
              address.city || 
              address.town || 
              address.village || 
              address.county || 
              address.state_district || 
              ''
            
            // Extract pin code
            const pinCode = address.postcode || ''
            
            // Build full address
            const fullAddress = [
              address.road || address.street || '',
              address.suburb || address.neighbourhood || '',
              address.city || address.town || address.village || '',
              address.state || '',
            ].filter(Boolean).join(', ')
            
            setFormData(prev => ({
              ...prev,
              location: location,
              pinCode: pinCode,
              address: fullAddress || prev.address,
            }))
          }
        } catch (error) {
          console.error('Error fetching location details:', error)
          alert('Could not fetch location details. Please enter manually.')
        } finally {
          setIsLoadingLocation(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Could not get your location. Please allow location access or enter manually.')
        setIsLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ShippingInfo> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required'
    } else if (!/^[6-9]\d{9}$/.test(formData.mobileNumber.trim())) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number'
    }
    if (!formData.landmark.trim()) {
      newErrors.landmark = 'Landmark is required'
    }

    setErrors(newErrors)
    
    // Scroll to first error field
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0]
      const element = document.getElementById(firstErrorField)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.focus()
      }
    }
    
    return Object.keys(newErrors).length === 0
  }

  const handleProcessToPay = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Check if terms are accepted
    if (!termsAccepted) {
      alert('Please accept the terms and conditions to proceed')
      return
    }

    setIsProcessingPayment(true)

    try {
      // Generate unique order ID
      const orderId = generateOrderId()
      
      // Create order via API
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderAmount: total, // Total = Product Price + Shipping (if applicable)
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerEmail: `${formData.mobileNumber}@ryza.com`,
          customerPhone: formData.mobileNumber,
          orderId: orderId,
          returnUrl: `${window.location.origin}/payment/return?order_id=${orderId}`,
          cart: cart, // Send cart items for email
          shippingInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: formData.address,
            location: formData.location,
            mobileNumber: formData.mobileNumber,
            landmark: formData.landmark,
            pinCode: formData.pinCode,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        // Handle rate limit errors specifically
        if (response.status === 429 || data.rateLimitError) {
          const retryAfter = data.retryAfter || 60
          alert(`${data.error || 'Too many payment requests. Please wait a moment and try again.'}`)
          setIsProcessingPayment(false)
          return
        }
        // Show user-friendly error message (technical details are hidden)
        throw new Error(data.error || 'Payment processing failed. Please try again.')
      }

      // Store order details in localStorage for later reference
      localStorage.setItem('pending_order', JSON.stringify({
        orderId: orderId,
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerPhone: formData.mobileNumber,
        address: formData.address,
        location: formData.location,
        pinCode: formData.pinCode,
        landmark: formData.landmark,
        total: total,
        cart: cart,
      }))

      // Load Cashfree SDK and redirect to checkout
      // Check if script already exists
      let cashfreeScript: HTMLScriptElement | null = document.querySelector('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]') as HTMLScriptElement | null
      
      if (!cashfreeScript) {
        cashfreeScript = document.createElement('script')
        cashfreeScript.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
        cashfreeScript.async = true
        document.body.appendChild(cashfreeScript)
      }

      // Wait for SDK to load
      const initCheckout = () => {
        // @ts-ignore - Cashfree SDK is loaded dynamically
        if (typeof Cashfree !== 'undefined') {
          // @ts-ignore - Cashfree SDK is loaded dynamically
          const cashfree = Cashfree({
            mode: 'production',
          })

          cashfree.checkout({
            paymentSessionId: data.payment_session_id,
            redirectTarget: '_self',
          })
        } else {
          // Retry after a short delay
          setTimeout(initCheckout, 100)
        }
      }

      if (cashfreeScript.getAttribute('data-loaded') === 'true') {
        initCheckout()
      } else {
        cashfreeScript.addEventListener('load', () => {
          cashfreeScript?.setAttribute('data-loaded', 'true')
          initCheckout()
        })
        initCheckout() // Try immediately in case it's already loaded
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      alert(`Payment failed: ${error.message || 'Something went wrong. Please try again.'}`)
      setIsProcessingPayment(false)
    }
  }

  // Calculate subtotal (product prices only)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  
  // Calculate shipping cost:
  // - If admin sets freeShippingThreshold = 0: Free shipping for all (shipping = 0)
  // - If admin sets freeShippingThreshold > 0 (e.g., 5000):
  //   - If subtotal >= threshold: Free shipping (shipping = 0)
  //   - If subtotal < threshold: Add ₹200 shipping (shipping = 200)
  const shipping = shippingSettings.freeShippingThreshold === 0
    ? 0  // Free shipping for all orders
    : subtotal >= shippingSettings.freeShippingThreshold
    ? 0  // Free shipping (order amount above threshold)
    : BASE_SHIPPING_COST  // Add ₹200 shipping (order below threshold)
  
  // Total amount = Product Price + Shipping (this is what goes to payment gateway)
  const total = subtotal + shipping

  if (cart.length === 0) {
    return (
      <div className="pt-20 md:pt-24 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add items to your cart to proceed to checkout</p>
            <Link
              href="/cart"
              className="inline-block px-8 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition-colors"
            >
              Back to Cart
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
          href="/cart"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to Cart
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Shipping Details Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleProcessToPay} className="bg-white rounded-xl shadow-md p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Details</h2>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.firstName ? 'border-red-500 border-2' : 'border-gray-300'
                    }`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.lastName ? 'border-red-500 border-2' : 'border-gray-300'
                    }`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  maxLength={10}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.mobileNumber ? 'border-red-500 border-2' : 'border-gray-300'
                  }`}
                  placeholder="Enter 10-digit mobile number"
                />
                {errors.mobileNumber && (
                  <p className="mt-1 text-sm text-red-500">{errors.mobileNumber}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.address ? 'border-red-500 border-2' : 'border-gray-300'
                  }`}
                  placeholder="Enter your complete address"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                )}
              </div>

              {/* Location and Pin Code with Geolocation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location/City <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.location ? 'border-red-500 border-2' : 'border-gray-300'
                      }`}
                      placeholder="Enter location/city"
                    />
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isLoadingLocation}
                      className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 touch-manipulation min-h-[44px]"
                      title="Use current location"
                    >
                      {isLoadingLocation ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiNavigation className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-500">{errors.location}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="pinCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Pin/Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="pinCode"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleInputChange}
                    maxLength={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.pinCode ? 'border-red-500 border-2' : 'border-gray-300'
                    }`}
                    placeholder="Enter 6-digit pin code"
                  />
                  {errors.pinCode && (
                    <p className="mt-1 text-sm text-red-500">{errors.pinCode}</p>
                  )}
                </div>
              </div>

              {/* Landmark */}
              <div>
                <label htmlFor="landmark" className="block text-sm font-medium text-gray-700 mb-2">
                  Landmark <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="landmark"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.landmark ? 'border-red-500 border-2' : 'border-gray-300'
                  }`}
                  placeholder="Enter nearby landmark"
                />
                {errors.landmark && (
                  <p className="mt-1 text-sm text-red-500">{errors.landmark}</p>
                )}
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked)
                      setShowPaymentInfo(e.target.checked)
                    }}
                    className="mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700">
                    I have read the{' '}
                    <a
                      href="https://theryza.com/returns"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 underline font-medium"
                    >
                      terms and conditions
                    </a>
                  </span>
                </label>
              </div>

              {/* Payment Methods Info Dropdown */}
              {showPaymentInfo && termsAccepted && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700">
                      We accept: UPI (QR Scan & Pay), Credit Cards, Debit Cards, EMI
                    </p>
                  </div>
                </div>
              )}

              {/* Process to Pay Button - Inside Form */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isProcessingPayment || !termsAccepted}
                  className="w-full py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors touch-manipulation min-h-[44px] text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Process to Payment'
                  )}
                </button>
                {!termsAccepted && (
                  <p className="mt-2 text-sm text-gray-600 text-center">
                    Please accept the terms and conditions to proceed
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex gap-3 pb-4 border-b border-gray-200 last:border-b-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h3>
                      {item.selectedSize && (
                        <p className="text-xs text-gray-600">Size: {item.selectedSize}</p>
                      )}
                      {item.selectedColor && (
                        <p className="text-xs text-gray-600">Color: {item.selectedColor}</p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
                        <div className="flex items-baseline gap-0.5 price-text text-gray-900">
                          <span className="currency text-xs text-gray-900">₹</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {Math.floor(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-baseline text-gray-600">
                  <span>Subtotal</span>
                  <div className="flex items-baseline gap-0.5 price-text text-gray-900">
                    <span className="currency text-sm text-gray-900">₹</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {Math.floor(subtotal).toLocaleString('en-IN')}
                    </span>
                    {subtotal % 1 !== 0 && (
                      <span className="text-sm font-semibold text-gray-900">
                        .{Math.round((subtotal % 1) * 100).toString().padStart(2, '0')}
                      </span>
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
                      <span className="text-lg font-semibold text-gray-900">
                        {Math.floor(shipping).toLocaleString('en-IN')}
                      </span>
                      {shipping % 1 !== 0 && (
                        <span className="text-sm font-semibold text-gray-900">
                          .{Math.round((shipping % 1) * 100).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {shippingSettings.freeShippingThreshold > 0 && subtotal < shippingSettings.freeShippingThreshold && (
                  <p className="text-sm text-primary-600">
                    Add ₹{Math.floor(shippingSettings.freeShippingThreshold - subtotal).toLocaleString('en-IN')} more for free shipping!
                  </p>
                )}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-baseline text-xl font-bold text-gray-900">
                    <span className="tracking-tight">Total</span>
                    <div className="flex items-baseline gap-1 price-text text-gray-900">
                      <span className="currency text-lg text-gray-900">₹</span>
                      <span className="text-3xl font-bold text-gray-900">
                        {Math.floor(total).toLocaleString('en-IN')}
                      </span>
                      {total % 1 !== 0 && (
                        <span className="text-lg font-semibold text-gray-900">
                          .{Math.round((total % 1) * 100).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

