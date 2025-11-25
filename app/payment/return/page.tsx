'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi'
import jsPDF from 'jspdf'

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
    doc.text('Modest Fashion Store', margin, 32)

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
    doc.text('Ryza - Modest Fashion Store', margin, pageHeight - 15)
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

  return (
    <div className="pt-20 md:pt-24 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Ryza"
                width={60}
                height={60}
                className="object-contain"
                priority
              />
              <span className="text-3xl md:text-4xl font-bold text-primary-600" style={{ fontFamily: 'inherit' }}>
                Ryza
              </span>
            </Link>
          </div>

          {paymentStatus === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <FiLoader className="w-16 h-16 text-primary-600 animate-spin" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Verifying Payment...
              </h1>
              <p className="text-gray-600">Please wait while we confirm your payment.</p>
            </>
          )}

          {paymentStatus === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Payment Successful!
              </h1>
              <p className="text-lg text-gray-700 mb-2 font-semibold">
                Thank you for your purchase!
              </p>
              <p className="text-gray-600 mb-6">
                Our support team will contact you soon for delivery. We'll process your order faster!
              </p>
              {orderDetails && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Order Details</h3>
                    <span
                      onClick={generateInvoice}
                      className="text-red-600 font-semibold cursor-pointer hover:text-red-700 hover:underline transition-colors"
                    >
                      Invoice
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium text-gray-900">{orderDetails.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium text-gray-900">
                        ₹{orderDetails.order_amount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-600">Paid</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/"
                  className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors text-lg"
                >
                  Go to Home
                </Link>
                <Link
                  href="/products"
                  className="px-8 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-lg"
                >
                  Continue Shopping
                </Link>
              </div>
            </>
          )}

          {paymentStatus === 'failed' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <FiXCircle className="w-12 h-12 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Payment Failed
              </h1>
              <p className="text-gray-600 mb-6">
                Your payment could not be processed. Please try again or use a different payment method.
              </p>
              {orderDetails && orderDetails.payment_message && (
                <div className="bg-red-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-700">{orderDetails.payment_message}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/checkout"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Try Again
                </Link>
                <Link
                  href="/cart"
                  className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
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

