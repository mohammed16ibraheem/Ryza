'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi'

export default function PaymentReturnPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [orderDetails, setOrderDetails] = useState<any>(null)

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
          // Check if order is paid - order_status === 'PAID' means payment successful
          if (data.order_status === 'PAID') {
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
              <p className="text-gray-600 mb-6">
                Thank you for your purchase. Your order has been confirmed.
              </p>
              {orderDetails && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
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
                  href="/products"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Continue Shopping
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Go to Home
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

