import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
      cart,
      shippingInfo,
    } = body

    // Validate required fields
    if (!orderAmount || !customerName || !customerPhone || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Payment integration removed - return error
    return NextResponse.json(
      { 
        error: 'Payment service not configured. Please contact support.',
      },
      { status: 503 }
    )
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create order',
      },
      { status: 500 }
    )
  }
}

