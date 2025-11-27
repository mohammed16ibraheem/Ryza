import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

    // Payment verification service removed
    return NextResponse.json(
      { error: 'Payment verification service not configured' },
      { status: 503 }
    )
  } catch (error: any) {
    console.error('Error verifying order:', error)
    return NextResponse.json(
      { error: 'Failed to verify order' },
      { status: 500 }
    )
  }
}

