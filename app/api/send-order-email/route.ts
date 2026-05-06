import { NextRequest, NextResponse } from 'next/server'
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderEmail'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderDetails, shippingInfo, cartItems } = body

    if (!orderDetails || !orderDetails.order_id) {
      return NextResponse.json(
        { error: 'Order details are required' },
        { status: 400 }
      )
    }

    // Transform cart items to match email format
    const emailCartItems = (cartItems || []).map((item: any, index: number) => ({
      id: index + 1,
      name: item.name || item.title || 'Product',
      price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0,
      quantity: item.quantity || 1,
      image: item.image || item.images?.[0] || '',
    }))

    // Send order confirmation email
    const result = await sendOrderConfirmationEmail(
      orderDetails,
      shippingInfo || {},
      emailCartItems
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Order confirmation email sent successfully',
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error sending order email:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send order email',
      },
      { status: 500 }
    )
  }
}

