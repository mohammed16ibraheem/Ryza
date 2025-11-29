import { NextRequest, NextResponse } from 'next/server'
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderEmail'

export const dynamic = 'force-dynamic'

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

    // Check if payment is successful (check both event type and payment status)
    const isSuccess = 
      isSuccessEvent ||
      paymentStatus === 'SUCCESS' || 
      paymentStatus === 'PAID' ||
      body?.data?.order?.order_status === 'PAID' ||
      body?.data?.orderStatus === 'PAID'

    // Handle successful payment
    if (isSuccess && orderId) {
      // Payment successful - send order confirmation email
      try {
        const orderDetails = {
          order_id: orderId,
          order_amount: orderAmount || 0,
          payment_status: paymentStatus || 'SUCCESS',
          payment_method: paymentMethod,
          cf_payment_id: paymentId,
        }

        const shippingInfo = {
          firstName: customerDetails.customer_name?.split(' ')[0] || customerDetails.firstName || '',
          lastName: customerDetails.customer_name?.split(' ').slice(1).join(' ') || customerDetails.lastName || '',
          address: customerDetails.address || '',
          location: customerDetails.location || customerDetails.city || '',
          mobileNumber: customerDetails.customer_phone || customerDetails.phone || '',
          landmark: customerDetails.landmark || '',
          pinCode: customerDetails.pinCode || customerDetails.pincode || '',
        }

        // Send order confirmation email
        await sendOrderConfirmationEmail(
          orderDetails,
          shippingInfo,
          [] // Cart items - would need to be stored/retrieved
        )

        console.log(`✅ Payment successful - Order confirmation email sent for order ${orderId}`)
      } catch (emailError) {
        console.error('Error sending order confirmation email:', emailError)
        // Don't fail webhook if email fails
      }
    } 
    // Handle failed payment
    else if (isFailedEvent || paymentStatus === 'FAILED' || paymentStatus === 'FAILURE') {
      console.log(`❌ Payment failed for order ${orderId}:`, {
        payment_status: paymentStatus,
        payment_id: paymentId,
        payment_method: paymentMethod,
        failure_reason: body?.data?.payment?.payment_message || body?.data?.failureReason || body?.failureReason,
      })
      // You can add additional failed payment handling here (e.g., notify admin, update database, etc.)
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
