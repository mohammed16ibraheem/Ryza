import { NextRequest, NextResponse } from 'next/server'
import { Cashfree, CFEnvironment } from 'cashfree-pg'
import { list } from '@vercel/blob'
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

    // First, try to get payment status from webhook data (more reliable)
    try {
      const blobPath = `payments/${orderId}.json`
      const token = process.env.BLOB_READ_WRITE_TOKEN
      
      if (token) {
        // List blobs with the specific path
        const { blobs } = await list({
          prefix: blobPath,
          token,
        })
        
        if (blobs && blobs.length > 0) {
          // Fetch the blob content (it's public, so we can fetch directly)
          const blob = blobs[0]
          const response = await fetch(blob.url)
          const webhookData = await response.json()
          
          if (webhookData && webhookData.payment_status) {
            // Use webhook data if available
            const isSuccess = webhookData.payment_status === 'SUCCESS' || 
                             webhookData.order_status === 'PAID'
            
            return NextResponse.json({
              success: true,
              order_id: webhookData.order_id,
              order_status: webhookData.order_status || (isSuccess ? 'PAID' : 'PENDING'),
              payment_status: webhookData.payment_status,
              order_amount: webhookData.order_amount,
              order_currency: 'INR',
              customer_details: webhookData.customer_details,
              payment_message: webhookData.payment_message || 
                (isSuccess ? 'Payment successful' : 'Payment pending'),
            })
          }
        }
      }
    } catch (blobError) {
      // If webhook data not found, fallback to API
      console.log('Webhook data not found, using API:', blobError)
    }

    // Fallback: Fetch order details from API
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

