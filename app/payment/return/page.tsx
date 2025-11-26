'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi'
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
        setShippingInfo({
          firstName: order.customerName?.split(' ')[0] || '',
          lastName: order.customerName?.split(' ').slice(1).join(' ') || '',
          mobileNumber: order.customerPhone || '',
          address: order.address || '',
          location: order.location || '',
          pinCode: order.pinCode || '',
          landmark: order.landmark || '',
        })
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
    
    if (orderDetails?.payment_status) {
      yPos = addText(`Payment Method: ${orderDetails.payment_status}`, margin, yPos, 10)
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
  }, [orderId])

  // Hide header on this page
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-3 py-4 sm:py-8">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 lg:p-12 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/logo.png"
                alt="Ryza"
                width={50}
                height={50}
                className="object-contain w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
                priority
              />
              <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-600" style={{ fontFamily: 'inherit' }}>
                Ryza
              </span>
            </Link>
          </div>

          {paymentStatus === 'loading' && (
            <>
              <div className="flex justify-center mb-4 sm:mb-6">
                <FiLoader className="w-12 h-12 sm:w-16 sm:h-16 text-primary-600 animate-spin" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
                Verifying Payment...
              </h1>
              <p className="text-sm sm:text-base text-gray-600 px-2">Please wait while we confirm your payment.</p>
            </>
          )}

          {paymentStatus === 'success' && (
            <>
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
                Payment Successful!
              </h1>
              <p className="text-base sm:text-lg text-gray-700 mb-2 font-semibold px-2">
                Thank you for your purchase!
              </p>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2">
                Our support team will contact you soon for delivery. We'll process your order faster!
              </p>
              {orderDetails && (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Order Details</h3>
                    <span
                      onClick={generateInvoice}
                      className="text-red-600 text-sm sm:text-base font-semibold cursor-pointer hover:text-red-700 hover:underline transition-colors active:scale-95"
                    >
                      Invoice
                    </span>
                  </div>
                  <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-gray-600 font-medium sm:font-normal">Order ID:</span>
                      <span className="font-medium text-gray-900 break-all sm:break-normal text-right sm:text-left">
                        {orderDetails.order_id}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-gray-600 font-medium sm:font-normal">Amount:</span>
                      <span className="font-medium text-gray-900 text-right sm:text-left">
                        ₹{orderDetails.order_amount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-gray-600 font-medium sm:font-normal">Status:</span>
                      <span className="font-medium text-green-600 text-right sm:text-left">Paid</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
                <Link
                  href="/"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors text-base sm:text-lg text-center"
                >
                  Go to Home
                </Link>
                <Link
                  href="/"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 active:bg-gray-400 transition-colors text-base sm:text-lg text-center"
                >
                  Continue Shopping
                </Link>
              </div>
            </>
          )}

          {paymentStatus === 'failed' && (
            <>
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <FiXCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" />
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
                Payment Failed
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2">
                Your payment could not be processed. Please try again or use a different payment method.
              </p>
              {orderDetails && orderDetails.payment_message && (
                <div className="bg-red-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 mx-2">
                  <p className="text-xs sm:text-sm text-red-700">{orderDetails.payment_message}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
                <Link
                  href="/checkout"
                  className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors text-base sm:text-lg text-center"
                >
                  Try Again
                </Link>
                <Link
                  href="/cart"
                  className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 active:bg-gray-400 transition-colors text-base sm:text-lg text-center"
                >
                  Back to Cart
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

