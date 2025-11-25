import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log webhook data for debugging
    console.log('Cashfree Webhook received:', body)
    
    // Verify webhook signature if needed (Cashfree provides signature verification)
    // For now, we'll just log and acknowledge
    
    // Process webhook data
    const { orderId, orderStatus, paymentStatus } = body
    
    // Here you can:
    // 1. Update order status in your database
    // 2. Send confirmation emails
    // 3. Update inventory
    // 4. Trigger fulfillment processes
    
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

