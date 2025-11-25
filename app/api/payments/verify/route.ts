import { NextRequest, NextResponse } from 'next/server'
import { Cashfree, CFEnvironment } from 'cashfree-pg'
import { 
  getUserFriendlyError, 
  isRateLimitError, 
  getRetryAfter, 
  logErrorForDevelopers,
  extractCashfreeError 
} from '@/lib/cashfree-errors'

export const dynamic = 'force-dynamic'

const cashfree = new Cashfree(
  CFEnvironment.PRODUCTION,
  process.env.CASHFREE_APP_ID || '',
  process.env.CASHFREE_SECRET_KEY || ''
)

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

    // Fetch order details
    const version = '2023-08-01'
    const response = await cashfree.PGFetchOrder(version, orderId)

    // Check for rate limit headers in response
    const rateLimitRemaining = response.headers?.['x-ratelimit-remaining']
    const rateLimitRetry = response.headers?.['x-ratelimit-retry']

    if (response.data) {
      const orderData = response.data
      
      // Extract payment message from order status
      let paymentMessage = 'Payment pending'
      if (orderData.order_status === 'PAID') {
        paymentMessage = 'Payment successful'
      } else if (orderData.order_status === 'FAILED') {
        paymentMessage = 'Payment failed'
      }
      
      return NextResponse.json({
        success: true,
        order_id: orderData.order_id,
        order_status: orderData.order_status,
        order_amount: orderData.order_amount,
        order_currency: orderData.order_currency,
        customer_details: orderData.customer_details,
        payment_message: paymentMessage,
        rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : undefined,
      })
    } else {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
  } catch (error: any) {
    // Extract Cashfree error details
    const cashfreeError = extractCashfreeError(error)
    
    // Log detailed error for developers (not shown to users)
    logErrorForDevelopers(cashfreeError, 'Verify Order API')
    
    // Check if it's a rate limit error
    if (isRateLimitError(error)) {
      const retryAfter = getRetryAfter(error)
      const userMessage = getUserFriendlyError(cashfreeError)
      
      return NextResponse.json(
        { 
          error: userMessage,
          rateLimitError: true,
          retryAfter: retryAfter,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
          }
        }
      )
    }
    
    // Get user-friendly error message (hide technical details)
    const userMessage = getUserFriendlyError(cashfreeError)
    
    // Return user-friendly error (technical details logged but not sent)
    return NextResponse.json(
      { 
        error: userMessage,
      },
      { status: 500 }
    )
  }
}

