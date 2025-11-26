import { Resend } from 'resend'

// Lazy initialization - only create Resend instance when needed
// This prevents build errors when RESEND_API_KEY is not available during build time
function getResendInstance() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(apiKey)
}

interface OrderItem {
  id: number
  name: string
  price: number
  image: string
  quantity: number
  selectedSize?: string
  selectedColor?: string
  description?: string
  weight?: string
}

interface ShippingInfo {
  firstName: string
  lastName: string
  address: string
  location: string
  mobileNumber: string
  landmark: string
  pinCode: string
}

interface OrderDetails {
  order_id: string
  order_amount: number
  payment_status?: string
  order_status?: string
  payment_message?: string
  payment_method?: string
  customer_details?: {
    customer_name?: string
    customer_phone?: string
    customer_email?: string
  }
  cf_payment_id?: string
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(text: string | undefined | null): string {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function sendOrderConfirmationEmail(
  orderDetails: OrderDetails,
  shippingInfo: ShippingInfo,
  cartItems: OrderItem[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theryza.com'
    const recipientEmail = 'ryzathehijabhouse@gmail.com'
    // Use root domain instead of subdomain - must match verified domain in Resend
    const fromEmail = 'orders@theryza.com'

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0
      const qty = item.quantity || 1
      return sum + (price * qty)
    }, 0)

    const shipping = orderDetails.order_amount && subtotal ? 
      (orderDetails.order_amount - subtotal) : 0
    const total = orderDetails.order_amount || subtotal

    // Format date
    const orderDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    // Build product list HTML
    const productListHTML = cartItems.map((item, index) => {
      const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0
      const itemQuantity = item.quantity || 1
      const itemTotal = itemPrice * itemQuantity
      
      // For email deliverability, use site domain for images
      // If image is from Vercel Blob, we'll use it directly (Resend will handle it)
      // For better deliverability, consider proxying images through your domain
      let imageUrl = item.image?.startsWith('http') 
        ? item.image 
        : `${siteUrl}${item.image?.startsWith('/') ? '' : '/'}${item.image || '/placeholder.jpg'}`
      
      // Note: Vercel Blob URLs work but for best deliverability, 
      // consider using a CDN subdomain like cdn.theryza.com or images.theryza.com

      // Escape user input to prevent XSS
      const escapedName = escapeHtml(item.name)
      const escapedDescription = item.description ? escapeHtml(item.description) : ''
      const escapedWeight = item.weight ? escapeHtml(item.weight) : ''
      const escapedSize = item.selectedSize ? escapeHtml(item.selectedSize) : ''
      const escapedColor = item.selectedColor ? escapeHtml(item.selectedColor) : ''
      
      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 20px 0; vertical-align: top;">
            <div style="display: flex; gap: 15px;">
              <div style="width: 80px; height: 80px; flex-shrink: 0;">
                <img 
                  src="${escapeHtml(imageUrl)}" 
                  alt="${escapedName || 'Product'}" 
                  style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;"
                  onerror="this.src='${siteUrl}/placeholder.jpg'"
                />
              </div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">
                  ${escapedName || 'Product'}
                </h3>
                ${escapedDescription ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">${escapedDescription}</p>` : ''}
                ${escapedWeight ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">Weight: ${escapedWeight}</p>` : ''}
                ${escapedSize ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">Size: ${escapedSize}</p>` : ''}
                ${escapedColor ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">Color: ${escapedColor}</p>` : ''}
                <div style="display: flex; gap: 15px; margin-top: 8px; font-size: 14px; color: #374151;">
                  <span>Price: ₹${itemPrice.toLocaleString('en-IN')}</span>
                  <span>Qty: ${itemQuantity}</span>
                  <span style="font-weight: 600;">Total: ₹${itemTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      `
    }).join('')

    // HTML Email Template
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Ryza</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #92487A 0%, #b85a8f 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 1px;">
                RYZA
              </h1>
              <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">
                Hijab House
              </p>
            </td>
          </tr>

          <!-- Success Message -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f0fdf4; border-bottom: 2px solid #22c55e;">
              <div style="width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ffffff; font-size: 32px;">✓</span>
              </div>
              <h2 style="margin: 0 0 10px 0; color: #166534; font-size: 24px; font-weight: 600;">
                Payment Successful!
              </h2>
              <p style="margin: 0; color: #15803d; font-size: 16px;">
                Thank you for your purchase. Your order has been confirmed.
              </p>
            </td>
          </tr>

          <!-- Order Information -->
          <tr>
            <td style="padding: 30px;">
              <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #111827; border-bottom: 2px solid #92487A; padding-bottom: 10px;">
                Order Information
              </h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Order ID:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(orderDetails.order_id)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order Date:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Status:</td>
                  <td style="padding: 8px 0; color: #22c55e; font-size: 14px; font-weight: 600;">Paid</td>
                </tr>
                ${orderDetails.cf_payment_id ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Transaction ID:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-family: monospace;">${escapeHtml(String(orderDetails.cf_payment_id))}</td>
                </tr>
                ` : ''}
                ${orderDetails.payment_method ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Method:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(orderDetails.payment_method)}</td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Product Details -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #111827; border-bottom: 2px solid #92487A; padding-bottom: 10px;">
                Product Details
              </h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                ${productListHTML}
              </table>
            </td>
          </tr>

          <!-- Shipping Details -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #111827; border-bottom: 2px solid #92487A; padding-bottom: 10px;">
                Shipping Details
              </h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">First Name:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(shippingInfo.firstName)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Last Name:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(shippingInfo.lastName)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Mobile Number:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${escapeHtml(shippingInfo.mobileNumber)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Address:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${escapeHtml(shippingInfo.address)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Location/City:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${escapeHtml(shippingInfo.location)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Pin/Postal Code:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${escapeHtml(shippingInfo.pinCode)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Landmark:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${escapeHtml(shippingInfo.landmark || 'N/A')}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Summary -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #111827; border-bottom: 2px solid #92487A; padding-bottom: 10px;">
                Order Summary
              </h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Subtotal:</td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">₹${subtotal.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Shipping:</td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 600;">₹${shipping.toLocaleString('en-IN')}</td>
                </tr>
                <tr style="border-top: 2px solid #92487A;">
                  <td style="padding: 15px 0 0 0; color: #111827; font-size: 18px; font-weight: 700;">Total Amount:</td>
                  <td style="padding: 15px 0 0 0; color: #92487A; font-size: 18px; font-weight: 700; text-align: right;">₹${total.toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                Thank you for shopping with Ryza!
              </p>
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                Our support team will contact you soon for delivery.
              </p>
              <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 12px;">
                For support, contact us via Instagram or WhatsApp
              </p>
              <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Ryza - Hijab House. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Initialize Resend instance (lazy initialization)
    const resend = getResendInstance()
    
    // Send email using Resend with tags for tracking
    // Note: Resend handles idempotency automatically based on content
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `Order Confirmation - ${escapeHtml(orderDetails.order_id)} | Ryza`,
      html: htmlContent,
      tags: [
        { name: 'order-confirmation', value: 'true' },
        { name: 'order-id', value: orderDetails.order_id },
      ],
    })

    if (error) {
      console.error('Resend email error:', error)
      return { success: false, error: error.message || 'Failed to send email' }
    }

    console.log('Order confirmation email sent successfully:', data?.id)
    return { success: true }
  } catch (error: any) {
    console.error('Error sending order confirmation email:', error)
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    }
  }
}

