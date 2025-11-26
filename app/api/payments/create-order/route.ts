import { NextRequest, NextResponse } from 'next/server'
import { Cashfree, CFEnvironment } from 'cashfree-pg'
import { put } from '@vercel/blob'
import { 
  getUserFriendlyError, 
  isRateLimitError, 
  getRetryAfter, 
  logErrorForDevelopers,
  extractCashfreeError 
} from '@/lib/cashfree-errors'

export const dynamic = 'force-dynamic'

const cashfree = new Cashfree(
  CFEnvironment.PRODUCTION, // Production mode
  process.env.CASHFREE_APP_ID || '',
  process.env.CASHFREE_SECRET_KEY || ''
)

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
      cart, // Cart items with product details
      shippingInfo, // Shipping details
    } = body

    // Validate required fields
    if (!orderAmount || !customerName || !customerPhone || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Store order details (cart + shipping) in blob for email sending later
    if (cart && shippingInfo) {
      try {
        const orderData = {
          orderId,
          cart,
          shippingInfo,
          orderAmount,
          customerName,
          customerPhone,
          customerEmail: customerEmail || `${customerPhone}@ryza.com`,
          createdAt: new Date().toISOString(),
        }
        
        await put(`orders/${orderId}.json`, JSON.stringify(orderData), {
          access: 'public',
          contentType: 'application/json',
        })
        console.log('Order data stored in blob for email:', orderId)
      } catch (blobError) {
        console.error('Error storing order data in blob:', blobError)
        // Continue even if blob storage fails - order creation should still proceed
      }
    }

    // Create order request
    const orderRequest = {
      order_amount: orderAmount,
      order_currency: 'INR',
      order_id: orderId,
      customer_details: {
        customer_id: customerPhone,
        customer_name: customerName,
        customer_email: customerEmail || `${customerPhone}@ryza.com`,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://theryza.com'}/payment/return`,
        notify_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://theryza.com'}/api/payments/webhook`,
      },
      order_note: 'Order from Ryza - Hijab House',
    }

    // Create order using Cashfree SDK
    const response = await cashfree.PGCreateOrder(orderRequest)
    
    // Check for rate limit headers in response
    const rateLimitRemaining = response.headers?.['x-ratelimit-remaining']
    const rateLimitRetry = response.headers?.['x-ratelimit-retry']
    
    if (response.data && response.data.payment_session_id) {
      return NextResponse.json({
        success: true,
        order_id: response.data.order_id,
        payment_session_id: response.data.payment_session_id,
        rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : undefined,
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to create order', details: response.data },
        { status: 500 }
      )
    }
  } catch (error: any) {
    // Extract Cashfree error details
    const cashfreeError = extractCashfreeError(error)
    
    // Log detailed error for developers (not shown to users)
    logErrorForDevelopers(cashfreeError, 'Create Order API')
    
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

