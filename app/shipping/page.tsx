'use client'

import { useState, useEffect } from 'react'

export default function ShippingPage() {
  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: 0, // Default to 0 (free shipping) instead of 5000
    shippingCost: 200, // Default shipping cost
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchShippingSettings = async () => {
      try {
        // Add timestamp to force fresh fetch (bypass browser cache)
        const timestamp = Date.now()
        const response = await fetch(`/api/shipping-settings?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        })
        
        if (!response.ok) {
          console.error('Failed to fetch shipping settings:', response.status)
          setLoading(false)
          return
        }
        
        const data = await response.json()
        console.log('Shipping settings fetched:', data) // Debug log
        
        if (data.freeShippingThreshold !== undefined || data.shippingCost !== undefined) {
          const threshold = typeof data.freeShippingThreshold === 'number' 
            ? data.freeShippingThreshold 
            : parseFloat(data.freeShippingThreshold) || 0
          const shippingCost = typeof data.shippingCost === 'number'
            ? data.shippingCost
            : parseFloat(data.shippingCost) || 200
          
          setShippingSettings({
            freeShippingThreshold: threshold,
            shippingCost: shippingCost,
          })
          console.log('Shipping settings updated:', { threshold, shippingCost }) // Debug log
        }
      } catch (error) {
        console.error('Error fetching shipping settings:', error)
      } finally {
        setLoading(false)
      }
    }
    
    // Fetch immediately on mount
    fetchShippingSettings()
    
    // Refresh shipping settings every 10 seconds to catch admin updates (reduced from 30s)
    const interval = setInterval(fetchShippingSettings, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="pt-20 md:pt-24 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Shipping Information
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Everything you need to know about our shipping and delivery
          </p>
        </div>

        {/* Shipping Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 space-y-6 md:space-y-8">
          {/* Processing Time */}
          <div className="border-l-4 border-primary-600 pl-4 md:pl-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Processing Time
            </h2>
            <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-4">
              All orders are processed within <strong>2-3 business days</strong> (Monday to Saturday, excluding public holidays). 
              We carefully pack and quality-check each item before shipping to ensure it reaches you in perfect condition.
            </p>
            <p className="text-gray-700 text-base md:text-lg leading-relaxed">
              Once your order is processed and shipped, you will receive a tracking number via email or WhatsApp 
              (if provided) to monitor your package.
            </p>
          </div>

          {/* Delivery Time */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-4">
              Delivery Timeframes
            </h3>
            <div className="space-y-4 text-blue-800 text-base md:text-lg">
              <div className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1 font-bold">•</span>
                <div>
                  <strong>Metro Cities:</strong> 3-5 business days
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1 font-bold">•</span>
                <div>
                  <strong>Tier 2 & 3 Cities:</strong> 5-7 business days
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1 font-bold">•</span>
                <div>
                  <strong>Remote Areas:</strong> 7-10 business days
                </div>
              </div>
            </div>
            <p className="text-blue-800 text-base md:text-lg leading-relaxed mt-4">
              <strong>Note:</strong> Delivery times may vary during peak seasons, festivals, or due to unforeseen circumstances 
              such as weather conditions or courier delays. We appreciate your patience.
            </p>
          </div>

          {/* Shipping Address */}
          <div className="border-t border-gray-200 pt-6 md:pt-8">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              Shipping Address
            </h3>
            <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-4">
              Please ensure your shipping address is complete and accurate at the time of checkout. 
              We are not responsible for delays or failed deliveries due to incorrect or incomplete addresses.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 md:p-6">
              <p className="text-gray-700 text-base md:text-lg">
                <strong>Important:</strong> If you need to change your shipping address after placing an order, 
                please contact us immediately via Instagram or WhatsApp. Changes can only be made if the order 
                hasn't been processed yet.
              </p>
            </div>
          </div>

          {/* Order Tracking */}
          <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-primary-900 mb-4">
              Track Your Order
            </h3>
            <p className="text-primary-800 text-base md:text-lg leading-relaxed mb-4">
              Once your order is shipped, you'll receive a tracking number that you can use to monitor your package's journey. 
              You can track your order through the courier's website or app using the provided tracking number.
            </p>
            <p className="text-primary-800 text-base md:text-lg leading-relaxed">
              If you haven't received your tracking information within 3 business days of placing your order, 
              please contact us for assistance.
            </p>
          </div>

          {/* International Shipping */}
          <div className="border-t border-gray-200 pt-6 md:pt-8">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              International Shipping
            </h3>
            <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-4">
              Currently, we ship within India only. International shipping may be available in the future. 
              Please check back or contact us for updates.
            </p>
          </div>

          {/* Contact Section */}
          <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6 md:p-8 text-center">
            <h3 className="text-xl md:text-2xl font-bold text-primary-900 mb-3">
              Questions About Shipping?
            </h3>
            <p className="text-primary-800 text-base md:text-lg mb-4">
              If you have any questions about shipping, delivery, or your order status, 
              please don't hesitate to reach out to us. We're here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://www.instagram.com/ryzathehijabhouse?utm_source=qr&igsh=aDF4c3B6czBubWN1"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Contact on Instagram
              </a>
              <a
                href="https://wa.me/message/5FWC42IHPLBSE1"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
            <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

