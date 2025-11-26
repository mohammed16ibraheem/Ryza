# Email Debugging Guide

## Issue: Email Not Received After Successful Payment

### Order ID: ORDER_1764157954028_aiojx2v9q_m16rutj7j_128ge4

## Steps to Debug:

### 1. Check Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**
- `RESEND_API_KEY` = `re_7vdtiEsg_Lk2RtpZxK81bsXRME1NLGSED`
- Make sure it's set for **Production** environment

### 2. Check Vercel Function Logs

Go to Vercel Dashboard → Your Project → Functions → `/api/payments/webhook`

Look for these log messages:
- ✅ `Payment successful, attempting to send email for order:`
- ✅ `Order confirmation email sent successfully`
- ❌ `RESEND_API_KEY is not configured`
- ❌ `Order data not found in blob`
- ❌ `Failed to send order confirmation email`

### 3. Check if Order Data Exists

The webhook needs to find order data at: `orders/ORDER_1764157954028_aiojx2v9q_m16rutj7j_128ge4.json`

**Possible Issues:**
- Order data wasn't stored when creating the order
- Order was created before the order data storage feature was added

### 4. Verify Webhook is Being Called

Check Cashfree Dashboard → Webhooks → Check if webhook is being triggered

### 5. Test Email Manually

You can test the email function by creating a test API route or checking Resend dashboard.

## Quick Fixes:

### Fix 1: Add RESEND_API_KEY to Vercel
1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Add: `RESEND_API_KEY` = `re_7vdtiEsg_Lk2RtpZxK81bsXRME1NLGSED`
4. Redeploy

### Fix 2: Check Order Data Storage
The order data should be stored when user clicks "Process to Pay" in checkout.
Check if the checkout page is sending `cart` and `shippingInfo` to `/api/payments/create-order`

### Fix 3: Verify Domain in Resend
1. Go to Resend Dashboard → Domains
2. Make sure `theryza.com` is verified (green checkmark)
3. Make sure `send.theryza.com` subdomain is set up

## Next Steps:

After adding RESEND_API_KEY and redeploying:
1. Make a test payment
2. Check Vercel logs for detailed error messages
3. Check Resend Dashboard → Emails to see if email was sent

