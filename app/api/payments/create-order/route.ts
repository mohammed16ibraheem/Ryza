import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Cashfree API configuration
const CASHFREE_API_BASE = 'https://api.cashfree.com/pg'
const CASHFREE_API_VERSION = '2025-01-01' // Upgraded to latest API version

// Helper function to get Cashfree credentials
function getCashfreeConfig() {
  const appId = process.env.CASHFREE_APP_ID
  const secretKey = process.env.CASHFREE_SECRET_KEY

  if (!appId || !secretKey) {
    throw new Error('Cashfree credentials not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY environment variables.')
  }

  return { appId, secretKey }
}

// Helper function to make authenticated requests to Cashfree API
async function cashfreeRequest(endpoint: string, method: string, body?: any) {
  const { appId, secretKey } = getCashfreeConfig()
  
  // Correct URL format: https://api.cashfree.com/pg/orders (API version goes in header, not URL)
  const url = `${CASHFREE_API_BASE}${endpoint}`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-api-version': CASHFREE_API_VERSION,
    'x-client-id': appId,
    'x-client-secret': secretKey,
  }

  const options: RequestInit = {
    method,
    headers,
  }

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  const data = await response.json()

  if (!response.ok) {
    // Enhanced error handling with specific error codes
    const errorInfo = {
      status: response.status,
      statusText: response.statusText,
      data,
      subCode: data.sub_code || data.code,
      message: data.message || response.statusText,
    }
    
    console.error('Cashfree API error:', errorInfo)
    
    // Throw error with status code for better handling
    const error: any = new Error(errorInfo.message)
    error.status = response.status
    error.subCode = errorInfo.subCode
    error.data = data
    throw error
  }

  return data
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderAmount,
      customerName,
      customerEmail,
      customerPhone,
      orderId,
      returnUrl,
      cart,
      shippingInfo,
    } = body

    // Validate required fields
    if (!orderAmount || !customerName || !customerPhone || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate order amount (must be positive)
    const amount = parseFloat(orderAmount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid order amount' },
        { status: 400 }
      )
    }

    // Get site URL for webhook
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theryza.com'
    const webhookUrl = `${siteUrl}/api/payments/webhook`

    // Prepare cart items for cart_details (if cart is provided)
    const cartItems = cart && Array.isArray(cart) ? cart.map((item: any, index: number) => {
      // Calculate discounted price (if discount exists)
      const originalPrice = parseFloat(item.price) || 0
      const discountedPrice = originalPrice // You can add discount logic here if needed
      
      return {
        item_id: `item_${item.id}_${index}`,
        item_name: item.name || 'Product',
        item_description: `${item.selectedColor ? `Color: ${item.selectedColor}` : ''}${item.selectedSize ? `, Size: ${item.selectedSize}` : ''}`.trim() || 'Product item',
        item_image_url: item.image || '',
        item_original_unit_price: originalPrice,
        item_discounted_unit_price: discountedPrice,
        item_quantity: item.quantity || 1,
        item_currency: 'INR',
      }
    }) : []

    // Prepare order tags for metadata (max 10 tags)
    const orderTags: Record<string, string> = {}
    if (cart && Array.isArray(cart)) {
      orderTags.total_items = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0).toString()
    }
    if (shippingInfo?.location) {
      orderTags.shipping_city = shippingInfo.location
    }
    if (shippingInfo?.pinCode) {
      orderTags.shipping_pincode = shippingInfo.pinCode
    }

    // Set order expiry time to 24 hours from now
    const orderExpiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Prepare order data for Cashfree
    const orderData: any = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerPhone, // Use phone as customer ID
        customer_name: customerName,
        customer_email: customerEmail || `${customerPhone}@ryza.com`,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: webhookUrl,
        // Valid payment methods according to Cashfree API: cc,dc,ppc,ccc,emi,paypal,upi,nb,app,paylater,applepay
        // Using: cc (credit card), dc (debit card), upi, nb (netbanking), app (wallet apps), paylater
        payment_methods: 'cc,dc,upi,nb,app,paylater',
      },
      order_expiry_time: orderExpiryTime,
      // Add shipping info as order notes (minimum 3 characters required, max 200)
      order_note: shippingInfo && shippingInfo.address
        ? `Shipping: ${shippingInfo.address}, ${shippingInfo.location || ''}, ${shippingInfo.pinCode || ''}`.trim().substring(0, 200)
        : 'Order from Ryza',
    }

    // Add cart_details if cart items exist
    if (cartItems.length > 0) {
      orderData.cart_details = {
        cart_items: cartItems,
      }
    }

    // Add order_tags if any tags exist
    if (Object.keys(orderTags).length > 0) {
      orderData.order_tags = orderTags
    }

    // Create payment session with Cashfree (with retry logic for duplicate order ID)
    let sessionResponse
    let attempts = 0
    const maxAttempts = 3
    
    while (attempts < maxAttempts) {
      try {
        sessionResponse = await cashfreeRequest('/orders', 'POST', orderData)
        
        if (!sessionResponse || !sessionResponse.payment_session_id) {
          throw new Error('Failed to create payment session')
        }
        
        // Success - break out of retry loop
        break
      } catch (error: any) {
        // Handle duplicate order ID (409) - generate new order ID and retry
        if (error.status === 409 && attempts < maxAttempts - 1) {
          console.warn(`Duplicate order ID detected (${orderData.order_id}), generating new order ID...`)
          // Generate new order ID
          const timestamp = Date.now()
          const random1 = Math.random().toString(36).substring(2, 11)
          const random2 = Math.random().toString(36).substring(2, 11)
          orderData.order_id = `ORDER_${timestamp}_${random1}_${random2}`
          attempts++
          continue
        }
        
        // Re-throw error if not a duplicate order ID or max attempts reached
        throw error
      }
    }
    
    if (!sessionResponse || !sessionResponse.payment_session_id) {
      throw new Error('Failed to create payment session after retries')
    }

    // For hosted checkout redirect, construct the payment URL
    // Note: The actual payment URL is handled by Cashfree SDK using payment_session_id
    // This URL is kept for fallback/reference purposes
    const paymentUrl = `https://payments.cashfree.com/orders/${sessionResponse.order_id || orderId}`

    // Return payment session details
    return NextResponse.json({
      success: true,
      payment_session_id: sessionResponse.payment_session_id,
      payment_url: paymentUrl,
      order_id: sessionResponse.order_id || orderId, // Use Cashfree's order_id if available
      cf_order_id: sessionResponse.cf_order_id, // Cashfree's unique order ID
      order_amount: amount,
    })
  } catch (error: any) {
    console.error('Error creating Cashfree order:', error)
    
    // Enhanced error handling based on HTTP status codes
    const status = error.status || 500
    const subCode = error.subCode || error.data?.sub_code || error.data?.code
    
    // Handle specific error codes
    switch (status) {
      case 400:
        // Bad Request - validation error
        return NextResponse.json(
          {
            error: error.data?.message || 'Invalid request. Please check your order details.',
            validationError: true,
            details: process.env.NODE_ENV === 'development' ? error.data : undefined,
          },
          { status: 400 }
        )
      
      case 401:
        // Authentication Failure
        return NextResponse.json(
          {
            error: 'Payment gateway authentication failed. Please contact support.',
            authError: true,
          },
          { status: 401 }
        )
      
      case 409:
        // Resource conflict (duplicate order ID) - should be handled in retry logic, but fallback here
        return NextResponse.json(
          {
            error: 'Order ID already exists. Please try again.',
            duplicateError: true,
          },
          { status: 409 }
        )
      
      case 422:
        // Input not in expected format
        return NextResponse.json(
          {
            error: error.data?.message || 'Invalid order data format. Please check your input.',
            validationError: true,
            details: process.env.NODE_ENV === 'development' ? error.data : undefined,
          },
          { status: 422 }
        )
      
      case 429:
        // Rate limiting
        return NextResponse.json(
          {
            error: 'Too many payment requests. Please wait a moment and try again.',
            rateLimitError: true,
            retryAfter: 60,
          },
          { status: 429 }
        )
      
      case 500:
      case 503:
        // Server errors
        return NextResponse.json(
          {
            error: 'Payment gateway is temporarily unavailable. Please try again later.',
            serverError: true,
          },
          { status: status }
        )
      
      default:
        // Generic error
        return NextResponse.json(
          {
            error: error.message || 'Failed to create payment order',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          },
          { status: status || 500 }
        )
    }
  }
}
