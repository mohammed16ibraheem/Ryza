import type { Metadata, Viewport } from 'next'
import { Open_Sans } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theryza.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Ryza - Modest Ladies Fashion & Accessories',
    template: '%s | Ryza',
  },
  description: 'Discover beautiful ladies dresses, hijabs, gift hampers, and hair accessories. Modest fashion for the modern Muslim woman.',
  keywords: ['hyderabad', 'dress', 'best quality', 'muslim', 'hijab', 'modest fashion', 'ladies dresses', 'muslim fashion', 'hijab accessories', 'gift hampers', 'hair essentials', 'jewellery', 'ryza', 'hyderabad muslim fashion', 'best quality hijab', 'hyderabad dress shop', 'muslim clothing hyderabad'],
  authors: [{ name: 'Ryza' }],
  creator: 'Ryza',
  publisher: 'Ryza',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Ryza',
    title: 'Ryza - Modest Ladies Fashion & Accessories',
    description: 'Discover beautiful ladies dresses, hijabs, gift hampers, and hair accessories. Modest fashion for the modern Muslim woman.',
    images: [
      {
        url: '/icon0.svg',
        width: 1000,
        height: 1000,
        alt: 'Ryza Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ryza - Modest Ladies Fashion & Accessories',
    description: 'Discover beautiful ladies dresses, hijabs, gift hampers, and hair accessories. Modest fashion for the modern Muslim woman.',
    images: ['/icon0.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon0.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon1.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/apple-icon.png',
      },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ryza',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#92487A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theryza.com'
  
  // Structured Data (JSON-LD) for better SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Ryza',
    description: 'Modest Ladies Fashion & Accessories - Discover beautiful ladies dresses, hijabs, gift hampers, and hair accessories.',
    url: siteUrl,
    logo: `${siteUrl}/icon0.svg`,
    image: `${siteUrl}/icon0.svg`,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
    },
    sameAs: [
      'https://www.instagram.com/ryzathehijabhouse',
    ],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={openSans.className}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-E397H4CLQW"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-E397H4CLQW');
          `}
        </Script>
        
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

