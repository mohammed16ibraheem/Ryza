import { NextRequest, NextResponse } from 'next/server'
import { Cashfree, CFEnvironment } from 'cashfree-pg'

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
    } = body

    // Validate required fields
    if (!orderAmount || !customerName || !customerPhone || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
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
      order_note: 'Order from Ryza - Modest Fashion Store',
    }

    // Create order using Cashfree SDK
    const response = await cashfree.PGCreateOrder(orderRequest)
    
    if (response.data && response.data.payment_session_id) {
      return NextResponse.json({
        success: true,
        order_id: response.data.order_id,
        payment_session_id: response.data.payment_session_id,
        order_token: response.data.order_token,
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to create order', details: response.data },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error creating Cashfree order:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create payment order',
        details: error.response?.data || error.message 
      },
      { status: 500 }
    )
  }
}

