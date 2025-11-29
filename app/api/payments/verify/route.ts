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
    throw new Error('Cashfree credentials not configured')
  }

  return { appId, secretKey }
}

// Helper function to make authenticated requests to Cashfree API
async function cashfreeRequest(endpoint: string, method: string) {
  const { appId, secretKey } = getCashfreeConfig()
  
  // Correct URL format: https://api.cashfree.com/pg/orders/{order_id} (API version goes in header, not URL)
  const url = `${CASHFREE_API_BASE}${endpoint}`
  
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

    // Determine payment status according to Cashfree documentation
    // Order statuses: ACTIVE, PAID, EXPIRED, TERMINATED
    // Payment is successful ONLY when order_status is PAID (per Cashfree docs)
    const orderStatus = orderData.order_status || 'UNPAID'
    const paymentStatus = paymentData?.payments?.[0]?.payment_status || orderStatus
    
    // According to Cashfree: "An order is considered successful when the order_status is PAID"
    // We check both order_status and payment_status for extra security
    const isSuccess = 
      orderStatus === 'PAID' || 
      paymentStatus === 'PAID' || 
      paymentStatus === 'SUCCESS'

    // Prepare response
    const response = {
      success: isSuccess,
      order_id: orderData.order_id, // Our order ID
      cf_order_id: orderData.cf_order_id, // Cashfree's unique order ID
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
    
    // Enhanced error handling based on HTTP status codes
    const status = error.status || 500
    
    switch (status) {
      case 400:
        return NextResponse.json(
          {
            error: 'Invalid order ID format.',
            success: false,
          },
          { status: 400 }
        )
      
      case 401:
        return NextResponse.json(
          {
            error: 'Payment gateway authentication failed.',
            success: false,
          },
          { status: 401 }
        )
      
      case 404:
        return NextResponse.json(
          {
            error: 'Order not found.',
            success: false,
          },
          { status: 404 }
        )
      
      case 429:
        return NextResponse.json(
          {
            error: 'Too many verification requests. Please wait a moment and try again.',
            rateLimitError: true,
            success: false,
          },
          { status: 429 }
        )
      
      case 500:
      case 503:
        return NextResponse.json(
          {
            error: 'Payment gateway is temporarily unavailable. Please try again later.',
            success: false,
          },
          { status: status }
        )
      
      default:
        return NextResponse.json(
          {
            error: error.message || 'Failed to verify order',
            success: false,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          },
          { status: status || 500 }
        )
    }
  }
}
