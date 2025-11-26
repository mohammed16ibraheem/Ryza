# Ryza E-commerce Platform

A modern, full-featured e-commerce platform built with Next.js 14, TypeScript, and Tailwind CSS, optimized for Vercel deployment with Vercel Blob storage.

## Features

- 🛍️ **Product Management**: Upload products with images, videos, and color variants
- 📱 **Responsive Design**: Beautiful UI for both web and mobile
- 🎨 **Category Management**: Organize products by categories with custom thumbnails
- 🖼️ **Image Compression**: Automatic client-side image compression for fast loading
- 🎥 **Video Support**: Video uploads with automatic trimming and compression
- 🛒 **Shopping Cart**: Client-side cart management
- 🔍 **Product Filtering**: Filter by category and sub-category
- 📦 **Vercel Blob Storage**: Cloud storage for images and videos
- 💳 **Payment Gateway**: Cashfree integration for secure payments
- 📧 **Email Notifications**: Automated order confirmation emails via Resend

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: Vercel Blob (for images/videos)
- **Data**: JSON files (for product metadata)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Vercel Blob Storage

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database/Store**
3. Select **Blob**
4. Configure:
   - **Store Name**: `ryza-blob` (or your preferred name)
   - **Region**: Choose your preferred region (e.g., Mumbai, India)
   - **Environments**: Select Development, Preview, and Production
   - **Custom Prefix**: `BLOB` (optional)

5. Vercel will automatically create the `BLOB_READ_WRITE_TOKEN` environment variable

### 3. Environment Variables

#### Required Environment Variables

Add these to your Vercel project settings (Settings → Environment Variables):

1. **BLOB_READ_WRITE_TOKEN**
   - Automatically set by Vercel when you connect the Blob store
   - No manual configuration needed

2. **RESEND_API_KEY**
   - Get your API key from [Resend Dashboard](https://resend.com/api-keys)
   - Used for sending order confirmation emails
   - Required for email functionality

3. **CASHFREE_APP_ID**
   - Your Cashfree App ID from Cashfree dashboard
   - Required for payment processing

4. **CASHFREE_SECRET_KEY**
   - Your Cashfree Secret Key from Cashfree dashboard
   - Required for payment processing

5. **CASHFREE_WEBHOOK_SECRET** (Optional but recommended)
   - Webhook secret for verifying Cashfree webhook signatures
   - If not set, uses CASHFREE_SECRET_KEY as fallback

6. **NEXT_PUBLIC_SITE_URL**
   - Your site URL (e.g., `https://theryza.com`)
   - Used for payment redirects and email links

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

### 5. Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in Vercel
3. Vercel will automatically:
   - Detect Next.js
   - Install dependencies
   - Build your application
   - Deploy to production

## Project Structure

```
desing/
├── app/
│   ├── tahseen/            # Admin panel (login and dashboard)
│   │   ├── page.tsx        # Login page
│   │   └── dashboard/      # Admin dashboard for product management
│   ├── api/                # API routes
│   │   ├── upload/         # Image upload endpoint
│   │   ├── upload-video/   # Video upload endpoint
│   │   ├── products/      # Product CRUD operations
│   │   ├── category-thumbnails/  # Category thumbnail management
│   │   ├── auth/           # Authentication endpoints (login, logout, check)
│   │   └── shipping-settings/  # Shipping settings management
│   ├── products/           # Product listing and detail pages
│   ├── cart/               # Shopping cart page
│   └── ...
├── components/             # React components
├── lib/                    # Utility functions
│   └── compression.ts     # Image/video compression utilities
├── data/                   # JSON data files (product metadata)
└── public/                 # Static assets
```

## Admin Panel

Access the admin panel at `/tahseen` to:
- Login with username and password (protected route)
- Upload products with images and videos
- Manage product details (name, price, description)
- Organize products by category
- Upload category thumbnails
- Configure shipping settings
- Delete products (automatically removes files from Blob)

## Storage Details

### Vercel Blob Storage

- **Free Tier**: 1 GB storage, 100 GB bandwidth/month
- **Files Stored**: Images and videos are stored in Vercel Blob
- **Organization**: Files are organized by category and sub-category
- **URLs**: Blob URLs are automatically generated and stored in product data

### File Organization

```
images/
├── Salah-Essential/
├── Hijabs/
│   ├── Hijab-Essentials/
│   ├── Luxury-Hijabs/
│   └── Day-to-Day-Life/
├── Gift-Hampers/
├── Hair-Essentials/
├── Jewellery/
├── Offers/
└── category-thumbnails/
```

## Features in Detail

### Image Compression
- Automatic client-side compression before upload
- Max size: 500KB per image
- Max dimensions: 1200x1200px
- Format: JPEG with 80% quality

### Video Compression
- Automatic trimming to 1 minute maximum
- Resolution: Max 1280x720px
- Bitrate: Optimized for web
- Format: WebM

### Product Management
- Up to 4 images per product (1 thumbnail + 3 product images)
- 1 video per product
- Color variants with separate images
- Out-of-stock image marking
- Category and sub-category organization

## Deployment

### Vercel (Recommended)

1. **Connect Repository**: Link your Git repository to Vercel
2. **Configure Project**: Vercel auto-detects Next.js settings
3. **Connect Blob Store**: Link your Blob store in project settings
4. **Deploy**: Automatic deployment on every push

### Environment Variables

**Required:**
- `BLOB_READ_WRITE_TOKEN` - Automatically set when Blob store is connected
- `RESEND_API_KEY` - Your Resend API key for sending emails
- `CASHFREE_APP_ID` - Your Cashfree App ID
- `CASHFREE_SECRET_KEY` - Your Cashfree Secret Key
- `CASHFREE_WEBHOOK_SECRET` - (Optional) Webhook secret for signature verification
- `NEXT_PUBLIC_SITE_URL` - Your site URL (e.g., `https://theryza.com`)

**Email Configuration:**
- Domain must be verified in Resend dashboard
- Emails are sent from `orders@theryza.com`
- Recipient email: `ryzathehijabhouse@gmail.com`
- Only sent on successful payments

## Free Tier Limits

### Vercel Blob
- **Storage**: 1 GB
- **Bandwidth**: 100 GB/month
- **Perfect for**: Small to medium e-commerce sites

### Vercel Hosting
- **Bandwidth**: 100 GB/month
- **Builds**: Unlimited
- **Functions**: 100 GB-hours/month

## Troubleshooting

### Upload Fails
- Check that `BLOB_READ_WRITE_TOKEN` is set in Vercel environment variables
- Verify Blob store is connected to your project
- Check Vercel dashboard for storage usage

### Images Not Displaying
- Verify Blob URLs are correctly stored in product data
- Check browser console for CORS or loading errors
- Ensure Blob store is accessible (public access enabled)

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors: `npm run build`
- Verify all environment variables are set

## Support

For issues or questions:
1. Check Vercel dashboard for storage usage and errors
2. Review API route logs in Vercel dashboard
3. Check browser console for client-side errors

## License

Private project - All rights reserved




