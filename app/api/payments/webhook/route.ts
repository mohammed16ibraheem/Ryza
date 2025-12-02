import { NextRequest, NextResponse } from 'next/server'
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderEmail'

export const dynamic = 'force-dynamic'

// In-memory cache to prevent duplicate emails (clears on server restart)
// In production, consider using Redis or database for persistence
const sentEmailsCache = new Map<string, number>()

// Clean up old entries (older than 1 hour) to prevent memory leak
function cleanupOldEntries() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  // Use forEach for compatibility with TypeScript compilation
  sentEmailsCache.forEach((timestamp, orderId) => {
    if (timestamp < oneHourAgo) {
      sentEmailsCache.delete(orderId)
    }
  })
}

// Check if email was already sent for this order
function hasEmailBeenSent(orderId: string): boolean {
  cleanupOldEntries()
  return sentEmailsCache.has(orderId)
}

// Mark email as sent for this order
function markEmailAsSent(orderId: string) {
  sentEmailsCache.set(orderId, Date.now())
}

// Helper function to verify webhook signature (optional but recommended)
function verifyWebhookSignature(body: string, signature: string | null): boolean {
  // If webhook secret is configured, verify signature
  const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY
  
  if (!webhookSecret || !signature) {
    // If no secret configured, accept webhook (not recommended for production)
    console.warn('Webhook signature verification skipped - CASHFREE_WEBHOOK_SECRET not configured')
    return true
  }

  // Cashfree webhook signature verification
  // In production, you should verify the signature using Cashfree's algorithm
  // For now, we'll log and accept (you can enhance this later)
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = request.headers.get('x-cashfree-signature') || 
                     request.headers.get('x-webhook-signature') ||
                     null

    // Get raw body for signature verification
    const bodyText = await request.text()
    const body = JSON.parse(bodyText)

    // Verify webhook signature
    if (!verifyWebhookSignature(bodyText, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Extract event type (for 2025-01-01 webhook version)
    const eventType = body?.type || body?.event || body?.eventType
    const isSuccessEvent = eventType === 'PAYMENT_SUCCESS' || eventType === 'success payment' || eventType === 'SUCCESS'
    const isFailedEvent = eventType === 'PAYMENT_FAILED' || eventType === 'failed payment' || eventType === 'FAILED'

    // Log webhook data for debugging
    console.log('Cashfree webhook received:', {
      event_type: eventType,
      type: body?.type,
      event: body?.event,
      order_id: body?.data?.order?.order_id || body?.order_id,
      payment_status: body?.data?.payment?.payment_status || body?.payment_status,
    })

    // Extract order and payment information (support both 2023-08-01 and 2025-01-01 formats)
    const orderId = body?.data?.order?.order_id || body?.data?.orderId || body?.order_id
    const paymentStatus = body?.data?.payment?.payment_status || 
                         body?.data?.paymentStatus || 
                         body?.payment_status || 
                         body?.data?.order?.order_status ||
                         body?.data?.orderStatus
    const paymentId = body?.data?.payment?.cf_payment_id || 
                     body?.data?.payment?.payment_id ||
                     body?.data?.paymentId ||
                     body?.cf_payment_id
    const cashfreeOrderId = body?.data?.order?.cf_order_id || 
                           body?.data?.order?.order_id ||
                           body?.data?.cf_order_id ||
                           body?.cf_order_id ||
                           orderId // Fallback to order_id if cf_order_id not available
    const paymentMethod = body?.data?.payment?.payment_method || 
                         body?.data?.paymentMethod ||
                         body?.payment_method
    const orderAmount = body?.data?.order?.order_amount || 
                       body?.data?.orderAmount ||
                       body?.order_amount
    const customerDetails = body?.data?.order?.customer_details || 
                          body?.data?.customerDetails ||
                          body?.customer_details || 
                          {}
    
    // Extract order tags (contains cart and shipping data)
    const orderTags = body?.data?.order?.order_tags || 
                     body?.data?.orderTags ||
                     body?.order_tags || 
                     {}

    // STRICT CHECK: Payment is successful ONLY if:
    // 1. Event type is PAYMENT_SUCCESS, AND
    // 2. Payment status is SUCCESS or PAID, AND
    // 3. Order ID exists
    // This ensures email is sent ONLY on confirmed successful payment
    const isSuccessEventType = isSuccessEvent
    const isSuccessStatus = 
      paymentStatus === 'SUCCESS' || 
      paymentStatus === 'PAID' ||
      body?.data?.order?.order_status === 'PAID' ||
      body?.data?.orderStatus === 'PAID'
    
    // Payment is successful ONLY if both event type AND status indicate success
    const isSuccess = isSuccessEventType && isSuccessStatus && orderId
    
    // Explicitly check for failed/pending statuses to prevent email
    const isFailed = isFailedEvent || 
                    paymentStatus === 'FAILED' || 
                    paymentStatus === 'FAILURE' ||
                    paymentStatus === 'PENDING' ||
                    paymentStatus === 'CANCELLED'
    
    // Log payment status for debugging
    console.log('Payment status check:', {
      orderId,
      eventType,
      paymentStatus,
      isSuccessEventType,
      isSuccessStatus,
      isSuccess,
      isFailed,
      willSendEmail: isSuccess && !isFailed
    })

    // Handle successful payment - EMAIL SENT ONLY HERE
    if (isSuccess && !isFailed && orderId) {
      // Check if email was already sent for this order (prevent duplicates)
      if (hasEmailBeenSent(orderId)) {
        console.log(`⚠️ SKIPPED: Email already sent for order ${orderId} - Preventing duplicate email`)
        return NextResponse.json({
          success: true,
          message: 'Webhook processed successfully - Email already sent (duplicate prevented)',
          order_id: orderId,
          payment_status: paymentStatus,
          email_sent: false,
          reason: 'duplicate_prevented'
        })
      }

      // Payment confirmed successful - send order confirmation email
      console.log(`✅ CONFIRMED: Payment successful for order ${orderId} - Sending email...`)
      try {
        const orderDetails = {
          order_id: orderId,
          order_amount: orderAmount || 0,
          payment_status: paymentStatus || 'SUCCESS',
          payment_method: paymentMethod,
          cf_payment_id: paymentId, // Transaction ID
          cf_order_id: cashfreeOrderId, // Cashfree Order ID
        }

        // Retrieve shipping info from order_tags (primary source) and customer_details (fallback)
        let shippingInfo = {
          firstName: orderTags.shipping_firstname || customerDetails.customer_name?.split(' ')[0] || customerDetails.firstName || '',
          lastName: orderTags.shipping_lastname || customerDetails.customer_name?.split(' ').slice(1).join(' ') || customerDetails.lastName || '',
          address: orderTags.shipping_address || customerDetails.address || '',
          location: orderTags.shipping_city || customerDetails.location || customerDetails.city || '',
          mobileNumber: orderTags.shipping_mobile || customerDetails.customer_phone || customerDetails.phone || '',
          landmark: orderTags.shipping_landmark || customerDetails.landmark || '',
          pinCode: orderTags.shipping_pincode || customerDetails.pinCode || customerDetails.pincode || '',
        }
        
        // Fallback: Try to extract shipping info from order_note if order_tags are empty
        if (!shippingInfo.firstName && !shippingInfo.lastName) {
          const orderNote = body?.data?.order?.order_note || ''
          if (orderNote && orderNote.includes('Ship:')) {
            // Parse order_note format: "Ship: FirstName LastName, Location, PinCode"
            const shipMatch = orderNote.match(/Ship:\s*([^,]+),\s*([^,]+),\s*(\d+)/)
            if (shipMatch) {
              const nameParts = shipMatch[1].trim().split(' ')
              shippingInfo.firstName = nameParts[0] || shippingInfo.firstName
              shippingInfo.lastName = nameParts.slice(1).join(' ') || shippingInfo.lastName
              shippingInfo.location = shipMatch[2].trim() || shippingInfo.location
              shippingInfo.pinCode = shipMatch[3].trim() || shippingInfo.pinCode
            }
          }
        }

        // Retrieve cart items from cart_details (Cashfree provides this)
        let cartItems: any[] = []
        if (body?.data?.order?.cart_details?.cart_items && Array.isArray(body.data.order.cart_details.cart_items)) {
          cartItems = body.data.order.cart_details.cart_items.map((item: any) => ({
            id: item.item_id || '',
            name: item.item_name || 'Product',
            price: item.item_original_unit_price || item.item_discounted_unit_price || 0,
            image: item.item_image_url || '',
            images: item.item_image_url ? [item.item_image_url] : [],
            quantity: item.item_quantity || 1,
            selectedSize: '',
            selectedColor: '',
            description: item.item_description || '',
          }))
        }
        
        // If no cart items found, create a basic entry from order amount
        if (cartItems.length === 0 && orderAmount) {
          cartItems = [{
            id: orderId,
            name: 'Order Items',
            price: orderAmount,
            image: '',
            images: [],
            quantity: 1,
            selectedSize: '',
            selectedColor: '',
            description: `Order ${orderId}`,
          }]
        }

        // Send order confirmation email with complete data
        const emailResult = await sendOrderConfirmationEmail(
          orderDetails,
          shippingInfo,
          cartItems
        )

        if (emailResult.success) {
          // Mark email as sent to prevent duplicates
          markEmailAsSent(orderId)
          console.log(`✅ SUCCESS: Order confirmation email sent for order ${orderId} with ${cartItems.length} items - Email marked as sent`)
        } else {
          console.error(`❌ ERROR: Failed to send order confirmation email for order ${orderId}:`, emailResult.error)
          // Don't mark as sent if email failed, so it can be retried
        }
      } catch (emailError) {
        console.error('❌ ERROR: Exception while sending order confirmation email:', emailError)
        // Don't fail webhook if email fails, but log the error
        // Don't mark as sent if exception occurred
      }
    } 
    // Handle failed/pending/cancelled payment - NO EMAIL SENT
    else if (isFailed) {
      console.log(`❌ SKIPPED: Payment not successful for order ${orderId} - NO EMAIL SENT:`, {
        payment_status: paymentStatus,
        event_type: eventType,
        payment_id: paymentId,
        payment_method: paymentMethod,
        failure_reason: body?.data?.payment?.payment_message || body?.data?.failureReason || body?.failureReason,
      })
      // No email sent for failed/pending/cancelled payments
    }
    // Handle other cases (pending, unknown status) - NO EMAIL SENT
    else {
      console.log(`⚠️ SKIPPED: Payment status unclear for order ${orderId} - NO EMAIL SENT:`, {
        payment_status: paymentStatus,
        event_type: eventType,
        order_id: orderId,
      })
      // No email sent if payment status is unclear
    }

    // Always return success to Cashfree (even if email fails)
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      order_id: orderId,
      payment_status: paymentStatus,
    })
  } catch (error: any) {
    console.error('Error processing Cashfree webhook:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
