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
    throw new Error('Cashfree credentials not configured')
  }

  return { appId, secretKey }
}

// Helper function to make authenticated requests to Cashfree API
async function cashfreeRequest(endpoint: string, method: string) {
  const { appId, secretKey } = getCashfreeConfig()
  
  const url = `${CASHFREE_API_BASE}/${CASHFREE_API_VERSION}${endpoint}`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-api-version': CASHFREE_API_VERSION,
    'x-client-id': appId,
    'x-client-secret': secretKey,
  }

  const response = await fetch(url, {
    method,
    headers,
  })

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Fetch order details from Cashfree
    const orderData = await cashfreeRequest(`/orders/${orderId}`, 'GET')

    // Check if order exists
    if (!orderData || !orderData.order_id) {
      return NextResponse.json(
        { error: 'Order not found', success: false },
        { status: 404 }
      )
    }

    // Fetch payment details
    let paymentData = null
    try {
      paymentData = await cashfreeRequest(`/orders/${orderId}/payments`, 'GET')
    } catch (error) {
      console.warn('Could not fetch payment details:', error)
      // Continue without payment details if not available
    }

    // Determine payment status
    const orderStatus = orderData.order_status || 'UNPAID'
    const paymentStatus = paymentData?.payments?.[0]?.payment_status || orderStatus
    
    // Payment is successful if status is PAID or SUCCESS
    const isSuccess = 
      orderStatus === 'PAID' || 
      paymentStatus === 'PAID' || 
      paymentStatus === 'SUCCESS' ||
      orderData.payment_status === 'SUCCESS'

    // Prepare response
    const response = {
      success: isSuccess,
      order_id: orderData.order_id,
      order_amount: orderData.order_amount,
      order_currency: orderData.order_currency || 'INR',
      order_status: orderStatus,
      payment_status: paymentStatus,
      payment_message: isSuccess 
        ? 'Payment successful' 
        : paymentData?.payments?.[0]?.payment_message || orderData.payment_message || 'Payment pending',
      payment_method: paymentData?.payments?.[0]?.payment_method || undefined,
      cf_payment_id: paymentData?.payments?.[0]?.cf_payment_id || paymentData?.payments?.[0]?.payment_id || undefined,
      customer_details: orderData.customer_details || {},
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error verifying Cashfree order:', error)
    
    // Handle rate limiting
    if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      return NextResponse.json(
        {
          error: 'Too many verification requests. Please wait a moment and try again.',
          rateLimitError: true,
          success: false,
        },
        { status: 429 }
      )
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to verify order',
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
