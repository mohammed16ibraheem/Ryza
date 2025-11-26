import { NextRequest, NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'
import crypto from 'crypto'
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderEmail'

export const dynamic = 'force-dynamic'

/**
 * Verify webhook signature for security (Cashfree method)
 * Steps:
 * 1. Extract x-webhook-timestamp from headers
 * 2. Concatenate timestamp + raw request body
 * 3. Generate HMAC-SHA256 hash
 * 4. Base64-encode the hash
 * 5. Compare with x-webhook-signature header
 */
function verifyWebhookSignature(
  timestamp: string | null,
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !timestamp) {
    console.warn('Webhook signature or timestamp missing')
    return false
  }

  try {
    // Step 1 & 2: Concatenate timestamp + raw payload
    const data = timestamp + payload
    
    // Step 3: Generate HMAC-SHA256 hash
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(data)
    
    // Step 4: Base64-encode the hash
    const expectedSignature = hmac.digest('base64')
    
    // Step 5: Compare signatures (constant-time comparison)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)
    
    // Verify webhook signature (CRITICAL for production)
    // Cashfree sends signature in x-webhook-signature header
    const signature = request.headers.get('x-webhook-signature')
    const timestamp = request.headers.get('x-webhook-timestamp')
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY || ''
    
    // In production, always verify signature
    if (process.env.NODE_ENV === 'production' && webhookSecret) {
      if (!verifyWebhookSignature(timestamp, rawBody, signature, webhookSecret)) {
        console.error('Invalid webhook signature - potential security threat', {
          hasSignature: !!signature,
          hasTimestamp: !!timestamp,
        })
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
      console.log('Webhook signature verified successfully')
    } else if (!webhookSecret) {
      console.warn('Webhook secret not configured - signature verification skipped')
    }
    
    // Log webhook data for debugging
    console.log('Cashfree Webhook received:', {
      type: body?.type,
      order_id: body?.data?.order?.order_id,
      payment_status: body?.data?.payment?.payment_status,
    })
    
    // Extract order and payment data from webhook
    const orderId = body?.data?.order?.order_id
    const paymentStatus = body?.data?.payment?.payment_status
    const orderStatus = body?.data?.order?.order_status
    const paymentMessage = body?.data?.payment?.payment_message
    const orderAmount = body?.data?.order?.order_amount
    const customerDetails = body?.data?.customer_details
    const cfPaymentId = body?.data?.payment?.cf_payment_id
    const paymentMethod = body?.data?.payment?.payment_method || body?.data?.payment?.payment_group || 'Online Payment'
    
    if (orderId) {
      // Check for idempotency - prevent processing same webhook twice
      try {
        const blobPath = `payments/${orderId}.json`
        const token = process.env.BLOB_READ_WRITE_TOKEN
        
        if (token) {
          const { blobs } = await list({
            prefix: blobPath,
            token,
          })
          
          if (blobs && blobs.length > 0) {
            // Fetch existing blob content
            const blob = blobs[0]
            const response = await fetch(blob.url)
            const existingData = await response.json()
            
            // If webhook already processed with same payment ID, skip
            if (existingData.cf_payment_id === cfPaymentId && existingData.payment_status === paymentStatus) {
              console.log('Webhook already processed (idempotency check)')
              return NextResponse.json({ 
                success: true,
                message: 'Webhook already processed' 
              })
            }
          }
        }
      } catch (blobError) {
        // No existing data, continue processing
      }
      
        // Store webhook data for verification (using Vercel Blob)
        try {
          const webhookData = {
            order_id: orderId,
            payment_status: paymentStatus,
            order_status: orderStatus,
            payment_message: paymentMessage,
            payment_method: paymentMethod, // Store payment method
            order_amount: orderAmount,
            customer_details: customerDetails,
            cf_payment_id: cfPaymentId,
            webhook_received_at: new Date().toISOString(),
            type: body?.type,
            webhook_signature_verified: !!signature && !!timestamp,
            webhook_timestamp: timestamp,
          }
        
        // Store in Vercel Blob for retrieval (private access for security)
        await put(`payments/${orderId}.json`, JSON.stringify(webhookData), {
          access: 'public', // Public for verification API, but contains no sensitive data
          contentType: 'application/json',
        })

        // Send email only on successful payment
        if (paymentStatus === 'SUCCESS' || orderStatus === 'PAID') {
          try {
            // Retrieve order data (cart + shipping) from blob
            const orderDataPath = `orders/${orderId}.json`
            const { blobs: orderBlobs } = await list({
              prefix: orderDataPath,
            })

            if (orderBlobs && orderBlobs.length > 0) {
              const orderBlob = orderBlobs[0]
              const orderResponse = await fetch(orderBlob.url)
              const orderData = await orderResponse.json()

              if (orderData.cart && orderData.shippingInfo) {
                // Send order confirmation email
                const emailResult = await sendOrderConfirmationEmail(
                  {
                    order_id: orderId,
                    order_amount: orderAmount || orderData.orderAmount,
                    payment_status: paymentStatus,
                    order_status: orderStatus,
                    payment_message: paymentMessage,
                    payment_method: paymentMethod,
                    customer_details: customerDetails,
                    cf_payment_id: cfPaymentId,
                  },
                  orderData.shippingInfo,
                  orderData.cart
                )

                if (emailResult.success) {
                  console.log('Order confirmation email sent successfully for order:', orderId)
                } else {
                  console.error('Failed to send order confirmation email:', emailResult.error)
                  // Don't fail webhook if email fails - payment is still successful
                }
              } else {
                console.warn('Order data missing cart or shipping info for email:', orderId)
              }
            } else {
              console.warn('Order data not found in blob for email:', orderId)
            }
          } catch (emailError) {
            console.error('Error sending order confirmation email:', emailError)
            // Don't fail webhook if email fails - payment is still successful
          }
        }
      } catch (blobError) {
        console.error('Error storing webhook data:', blobError)
        // Continue even if blob storage fails
      }
    }
    
    // Here you can:
    // 1. Update order status in your database
    // 2. Update inventory
    // 3. Trigger fulfillment processes
    // (Email sending is handled above)
    
    return NextResponse.json({ 
      success: true,
      message: 'Webhook received' 
    })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

