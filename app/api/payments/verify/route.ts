import { NextRequest, NextResponse } from 'next/server'
import { Cashfree, CFEnvironment } from 'cashfree-pg'

export const dynamic = 'force-dynamic'

const cashfree = new Cashfree(
  CFEnvironment.PRODUCTION,
  process.env.CASHFREE_APP_ID || '',
  process.env.CASHFREE_SECRET_KEY || ''
)

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

    // Fetch order details
    const version = '2023-08-01'
    const response = await cashfree.PGFetchOrder(version, orderId)

    if (response.data) {
      const orderData = response.data
      return NextResponse.json({
        success: true,
        order_id: orderData.order_id,
        order_status: orderData.order_status,
        payment_status: orderData.payment_status,
        payment_message: orderData.payment_message,
        order_amount: orderData.order_amount,
        order_currency: orderData.order_currency,
        customer_details: orderData.customer_details,
        payment_details: orderData.payment_details,
      })
    } else {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
  } catch (error: any) {
    console.error('Error verifying Cashfree order:', error)
    return NextResponse.json(
      { 
        error: 'Failed to verify order',
        details: error.response?.data || error.message 
      },
      { status: 500 }
    )
  }
}

