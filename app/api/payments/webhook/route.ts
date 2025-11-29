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

    // Log webhook data for debugging
    console.log('Cashfree webhook received:', {
      type: body?.type,
      event: body?.event,
      order_id: body?.data?.order?.order_id || body?.order_id,
      payment_status: body?.data?.payment?.payment_status || body?.payment_status,
    })

    // Extract order and payment information
    const orderId = body?.data?.order?.order_id || body?.order_id
    const paymentStatus = body?.data?.payment?.payment_status || body?.payment_status || body?.data?.order?.order_status
    const paymentId = body?.data?.payment?.cf_payment_id || body?.cf_payment_id
    const paymentMethod = body?.data?.payment?.payment_method || body?.payment_method
    const orderAmount = body?.data?.order?.order_amount || body?.order_amount
    const customerDetails = body?.data?.order?.customer_details || body?.customer_details || {}

    // Check if payment is successful
    const isSuccess = 
      paymentStatus === 'SUCCESS' || 
      paymentStatus === 'PAID' ||
      body?.data?.order?.order_status === 'PAID'

    if (isSuccess && orderId) {
      // Payment successful - send order confirmation email
      try {
        // Try to get order details from localStorage or database
        // For now, we'll send email with available data
        const orderDetails = {
          order_id: orderId,
          order_amount: orderAmount || 0,
          payment_status: paymentStatus || 'SUCCESS',
          payment_method: paymentMethod,
          cf_payment_id: paymentId,
        }

        const shippingInfo = {
          firstName: customerDetails.customer_name?.split(' ')[0] || '',
          lastName: customerDetails.customer_name?.split(' ').slice(1).join(' ') || '',
          address: '',
          location: '',
          mobileNumber: customerDetails.customer_phone || '',
          landmark: '',
          pinCode: '',
        }

        // Send order confirmation email
        await sendOrderConfirmationEmail(
          orderDetails,
          shippingInfo,
          [] // Cart items - would need to be stored/retrieved
        )

        console.log(`Order confirmation email sent for order ${orderId}`)
      } catch (emailError) {
        console.error('Error sending order confirmation email:', emailError)
        // Don't fail webhook if email fails
      }
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
