import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Cashfree API configuration
const CASHFREE_API_BASE = 'https://api.cashfree.com/pg'
const CASHFREE_API_VERSION = '2023-08-01'

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
    console.error('Cashfree API error:', {
      status: response.status,
      statusText: response.statusText,
      data,
    })
    throw new Error(data.message || `Cashfree API error: ${response.statusText}`)
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

    // Prepare order data for Cashfree
    const orderData = {
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
        payment_methods: 'cc,dc,upi,netbanking,wallet,paylater', // All payment methods
      },
      // Add shipping info as order notes (minimum 3 characters required, max 200)
      order_note: shippingInfo && shippingInfo.address
        ? `Shipping: ${shippingInfo.address}, ${shippingInfo.location || ''}, ${shippingInfo.pinCode || ''}`.trim().substring(0, 200)
        : undefined,
    }

    // Create payment session with Cashfree
    const sessionResponse = await cashfreeRequest('/orders', 'POST', orderData)

    if (!sessionResponse || !sessionResponse.payment_session_id) {
      throw new Error('Failed to create payment session')
    }

    // For hosted checkout redirect, construct the payment URL
    // Cashfree hosted checkout URL format
    const paymentUrl = `https://payments.cashfree.com/orders/${orderId}`

    // Return payment session details
    return NextResponse.json({
      success: true,
      payment_session_id: sessionResponse.payment_session_id,
      payment_url: paymentUrl,
      order_id: orderId,
      order_amount: amount,
    })
  } catch (error: any) {
    console.error('Error creating Cashfree order:', error)
    
    // Handle rate limiting
    if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      return NextResponse.json(
        {
          error: 'Too many payment requests. Please wait a moment and try again.',
          rateLimitError: true,
          retryAfter: 60,
        },
        { status: 429 }
      )
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to create payment order',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
