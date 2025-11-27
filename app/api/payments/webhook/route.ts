import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log webhook data for debugging
    console.log('Payment webhook received:', {
      type: body?.type,
      order_id: body?.data?.order?.order_id,
      payment_status: body?.data?.payment?.payment_status,
    })
    
    // Payment webhook service removed
    return NextResponse.json({ 
      success: true,
      message: 'Webhook received but payment service not configured' 
    })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

