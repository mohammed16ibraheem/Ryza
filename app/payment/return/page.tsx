'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { FiCheckCircle, FiXCircle, FiLoader, FiDownload, FiHome, FiShoppingBag, FiRefreshCw } from 'react-icons/fi'
import jsPDF from 'jspdf'

// Force dynamic rendering - this page should never be statically generated
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function PaymentReturnPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('order_id')
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [shippingInfo, setShippingInfo] = useState<any>(null)
  const [cartItems, setCartItems] = useState<any[]>([])

  // Load shipping info and cart items from localStorage
  useEffect(() => {
    try {
      const pendingOrder = localStorage.getItem('pending_order')
      if (pendingOrder) {
        const order = JSON.parse(pendingOrder)
        // Use shippingInfo if available, otherwise fallback to old structure
        if (order.shippingInfo) {
          setShippingInfo(order.shippingInfo)
        } else {
          setShippingInfo({
            firstName: order.customerName?.split(' ')[0] || '',
            lastName: order.customerName?.split(' ').slice(1).join(' ') || '',
            mobileNumber: order.customerPhone || '',
            address: order.address || '',
            location: order.location || '',
            pinCode: order.pinCode || '',
            landmark: order.landmark || '',
          })
        }
        setCartItems(order.cart || [])
      }
    } catch (error) {
      console.error('Error loading order details:', error)
    }
  }, [])

  const generateInvoice = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let yPos = margin

    // Helper function to add text with wrapping
    const addText = (text: string, x: number, y: number, fontSize: number = 10, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')
      doc.setTextColor(color[0], color[1], color[2])
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin)
      doc.text(lines, x, y)
      return y + (lines.length * fontSize * 0.4)
    }

    // Header with Logo and Branding
    doc.setFillColor(146, 72, 122) // Primary color
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    // Logo placeholder (you can add actual logo image later)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('RYZA', margin, 25)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Hijab House', margin, 32)

    yPos = 50

    // Invoice Title
    doc.setTextColor(0, 0, 0)
    yPos = addText('INVOICE', margin, yPos, 20, true)
    yPos += 5

    // Order Information
    yPos = addText('Order Information', margin, yPos, 14, true)
    yPos += 3
    
    if (orderDetails?.order_id) {
      yPos = addText(`Order ID: ${orderDetails.order_id}`, margin, yPos, 10)
    }
    
    if (orderDetails?.order_amount) {
      yPos = addText(`Amount: ₹${orderDetails.order_amount.toLocaleString('en-IN')}`, margin, yPos, 10)
    }
    
    yPos = addText(`Status: Paid`, margin, yPos, 10)
    
    if (orderDetails?.payment_method) {
      yPos = addText(`Payment Method: ${orderDetails.payment_method}`, margin, yPos, 10)
    } else if (orderDetails?.payment_status) {
      // Fallback to payment_status if payment_method not available
      yPos = addText(`Payment Status: ${orderDetails.payment_status}`, margin, yPos, 10)
    }
    
    const currentDate = new Date().toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    yPos = addText(`Date: ${currentDate}`, margin, yPos, 10)
    yPos += 10

    // Product Details
    if (cartItems.length > 0) {
      yPos = addText('Product Details', margin, yPos, 14, true)
      yPos += 3

      cartItems.forEach((item, index) => {
        if (yPos > 250) {
          doc.addPage()
          yPos = margin
        }

        yPos = addText(`${index + 1}. ${item.name || 'Product'}`, margin, yPos, 11, true)
        
        if (item.description) {
          yPos = addText(`Description: ${item.description}`, margin + 5, yPos + 3, 9)
        }
        
        if (item.weight) {
          yPos = addText(`Weight: ${item.weight}`, margin + 5, yPos + 3, 9)
        }
        
        const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
        const itemQuantity = item.quantity || 1
        const itemTotal = itemPrice * itemQuantity
        
        yPos = addText(`Price: ₹${itemPrice.toLocaleString('en-IN')}`, margin + 5, yPos + 3, 9)
        yPos = addText(`Quantity: ${itemQuantity}`, margin + 5, yPos + 3, 9)
        yPos = addText(`Total: ₹${itemTotal.toLocaleString('en-IN')}`, margin + 5, yPos + 3, 9, true)
        
        yPos += 5
      })
      yPos += 5
    }

    // Shipping Details
    if (shippingInfo) {
      if (yPos > 240) {
        doc.addPage()
        yPos = margin
      }

      yPos = addText('Shipping Details', margin, yPos, 14, true)
      yPos += 3
      
      if (shippingInfo.firstName || shippingInfo.lastName) {
        yPos = addText(`Name: ${shippingInfo.firstName} ${shippingInfo.lastName}`.trim(), margin, yPos, 10)
      }
      
      if (shippingInfo.mobileNumber) {
        yPos = addText(`Mobile: ${shippingInfo.mobileNumber}`, margin, yPos, 10)
      }
      
      if (shippingInfo.address) {
        yPos = addText(`Address: ${shippingInfo.address}`, margin, yPos, 10)
      }
      
      if (shippingInfo.location) {
        yPos = addText(`Location: ${shippingInfo.location}`, margin, yPos, 10)
      }
      
      if (shippingInfo.pinCode) {
        yPos = addText(`Pin Code: ${shippingInfo.pinCode}`, margin, yPos, 10)
      }
      
      if (shippingInfo.landmark) {
        yPos = addText(`Landmark: ${shippingInfo.landmark}`, margin, yPos, 10)
      }
      
      yPos += 10
    }

    // Summary
    if (yPos > 240) {
      doc.addPage()
      yPos = margin
    }

    yPos = addText('Order Summary', margin, yPos, 14, true)
    yPos += 3

    const subtotal = cartItems.reduce((sum, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
      const qty = item.quantity || 1
      return sum + (price * qty)
    }, 0)

    const shipping = orderDetails?.order_amount && subtotal ? 
      (orderDetails.order_amount - subtotal) : 0
    const total = orderDetails?.order_amount || subtotal

    yPos = addText(`Subtotal: ₹${subtotal.toLocaleString('en-IN')}`, margin, yPos, 10)
    yPos = addText(`Shipping: ₹${shipping.toLocaleString('en-IN')}`, margin, yPos, 10)
    yPos = addText(`Total: ₹${total.toLocaleString('en-IN')}`, margin, yPos, 12, true, [146, 72, 122])
    yPos += 10

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text('Thank you for your purchase!', margin, pageHeight - 20)
    doc.text('Ryza - Hijab House', margin, pageHeight - 15)
    doc.text('For support, contact us via Instagram or WhatsApp', margin, pageHeight - 10)

    // Save PDF
    const fileName = `Invoice_${orderDetails?.order_id || 'Order'}_${Date.now()}.pdf`
    doc.save(fileName)
  }

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId) {
        setPaymentStatus('failed')
        return
      }

      try {
        const response = await fetch(`/api/payments/verify?order_id=${orderId}`)
        const data = await response.json()

        if (data.success) {
          // Check payment status - SUCCESS or PAID means payment successful
          const isSuccess = data.payment_status === 'SUCCESS' || 
                           data.order_status === 'PAID' ||
                           data.payment_message?.includes('Success') ||
                           data.payment_message?.includes('00::')
          
          if (isSuccess) {
            setPaymentStatus('success')
            setOrderDetails(data)
            
            // Send order confirmation email
            if (cartItems.length > 0 && shippingInfo) {
              fetch('/api/send-order-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  orderDetails: {
                    order_id: data.order_id,
                    order_amount: data.order_amount,
                    payment_status: data.payment_status || 'SUCCESS',
                    payment_method: data.payment_method,
                    cf_payment_id: data.cf_payment_id,
                  },
                  shippingInfo: shippingInfo,
                  cartItems: cartItems,
                }),
              }).catch(err => {
                console.error('Error sending order email:', err)
                // Don't fail the page if email fails
              })
            }
            
            // Clear cart on successful payment
            localStorage.removeItem('cart')
            localStorage.removeItem('pending_order')
            window.dispatchEvent(new Event('cartUpdated'))
          } else {
            setPaymentStatus('failed')
            setOrderDetails(data)
          }
        } else {
          // Check for rate limit error
          if (data.rateLimitError) {
            setPaymentStatus('failed')
            setOrderDetails({
              ...data,
              payment_message: data.message || 'Too many requests. Please try again later.',
            })
          } else {
            setPaymentStatus('failed')
            setOrderDetails(data)
          }
        }
      } catch (error) {
        console.error('Error verifying payment:', error)
        setPaymentStatus('failed')
      }
    }

    verifyPayment()
  }, [orderId, cartItems, shippingInfo])

  // Hide header and footer on this page
  useEffect(() => {
    const header = document.querySelector('header')
    const footer = document.querySelector('footer')
    if (header) header.style.display = 'none'
    if (footer) footer.style.display = 'none'
    
    return () => {
      if (header) header.style.display = ''
      if (footer) footer.style.display = ''
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-gray-50 flex items-center justify-center px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Logo Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-center">
            <Link href="/" className="inline-flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Ryza Logo"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 40px, (max-width: 768px) 48px, 56px"
                />
              </div>
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-wide">
                Ryza
              </span>
            </Link>
          </div>

          {/* Content Area */}
          <div className="p-4 sm:p-6 md:p-8 lg:p-10">
            {/* Loading State */}
            {paymentStatus === 'loading' && (
              <div className="text-center py-8 sm:py-12">
                <div className="flex justify-center mb-6 sm:mb-8">
                  <div className="relative">
                    <FiLoader className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-primary-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-primary-100 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Verifying Payment...
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-md mx-auto">
                  Please wait while we confirm your payment. This may take a few moments.
                </p>
              </div>
            )}

            {/* Success State */}
            {paymentStatus === 'success' && (
              <div className="text-center">
                {/* Success Icon */}
                <div className="flex justify-center mb-6 sm:mb-8">
                  <div className="relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-green-100 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <FiCheckCircle className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-green-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                      <span className="text-white text-xs sm:text-sm font-bold">✓</span>
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Payment Successful!
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-2 font-semibold">
                  Thank you for your purchase!
                </p>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8 max-w-lg mx-auto">
                  Your order has been confirmed. Our support team will contact you soon for delivery. We'll process your order faster!
                </p>

                {/* Order Details Card */}
                {orderDetails && (
                  <div className="bg-gradient-to-br from-gray-50 to-primary-50/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-gray-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Order Details</h3>
                      <button
                        onClick={generateInvoice}
                        className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-primary-600 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-primary-700 active:bg-primary-800 transition-all text-sm sm:text-base shadow-md hover:shadow-lg active:scale-95"
                      >
                        <FiDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Download Invoice</span>
                      </button>
                    </div>
                    <div className="space-y-3 sm:space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 pb-3 sm:pb-4 border-b border-gray-200">
                        <span className="text-sm sm:text-base text-gray-600 font-medium">Order ID:</span>
                        <span className="text-sm sm:text-base md:text-lg font-bold text-gray-900 break-all sm:break-normal text-right sm:text-left font-mono">
                          {orderDetails.order_id}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 pb-3 sm:pb-4 border-b border-gray-200">
                        <span className="text-sm sm:text-base text-gray-600 font-medium">Amount Paid:</span>
                        <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary-600 text-right sm:text-left">
                          ₹{orderDetails.order_amount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-sm sm:text-base text-gray-600 font-medium">Payment Status:</span>
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm sm:text-base font-semibold">
                          <FiCheckCircle className="w-4 h-4" />
                          Paid
                        </span>
                      </div>
                      {orderDetails.payment_method && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 pt-3 sm:pt-4 border-t border-gray-200">
                          <span className="text-sm sm:text-base text-gray-600 font-medium">Payment Method:</span>
                          <span className="text-sm sm:text-base font-semibold text-gray-900 text-right sm:text-left capitalize">
                            {orderDetails.payment_method}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 bg-primary-600 text-white rounded-xl sm:rounded-2xl font-semibold hover:bg-primary-700 active:bg-primary-800 transition-all text-base sm:text-lg shadow-lg hover:shadow-xl active:scale-95"
                  >
                    <FiHome className="w-5 h-5" />
                    <span>Go to Home</span>
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 bg-gray-100 text-gray-900 rounded-xl sm:rounded-2xl font-semibold hover:bg-gray-200 active:bg-gray-300 transition-all text-base sm:text-lg border-2 border-gray-200 hover:border-gray-300 active:scale-95"
                  >
                    <FiShoppingBag className="w-5 h-5" />
                    <span>Continue Shopping</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Failed State */}
            {paymentStatus === 'failed' && (
              <div className="text-center">
                {/* Failed Icon */}
                <div className="flex justify-center mb-6 sm:mb-8">
                  <div className="relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-red-100 rounded-full flex items-center justify-center shadow-lg">
                      <FiXCircle className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-red-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs sm:text-sm font-bold">✕</span>
                    </div>
                  </div>
                </div>

                {/* Failed Message */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Payment Failed
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6 max-w-lg mx-auto">
                  Your payment could not be processed. Please try again or use a different payment method.
                </p>

                {/* Error Message Card */}
                {orderDetails && orderDetails.payment_message && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 text-left">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <FiXCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm sm:text-base font-semibold text-red-900 mb-1">Error Details:</h4>
                        <p className="text-xs sm:text-sm text-red-700 leading-relaxed">
                          {orderDetails.payment_message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Link
                    href="/checkout"
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 bg-primary-600 text-white rounded-xl sm:rounded-2xl font-semibold hover:bg-primary-700 active:bg-primary-800 transition-all text-base sm:text-lg shadow-lg hover:shadow-xl active:scale-95"
                  >
                    <FiRefreshCw className="w-5 h-5" />
                    <span>Try Again</span>
                  </Link>
                  <Link
                    href="/cart"
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 bg-gray-100 text-gray-900 rounded-xl sm:rounded-2xl font-semibold hover:bg-gray-200 active:bg-gray-300 transition-all text-base sm:text-lg border-2 border-gray-200 hover:border-gray-300 active:scale-95"
                  >
                    <FiShoppingBag className="w-5 h-5" />
                    <span>Back to Cart</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
