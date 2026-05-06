import { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theryza.com'

export const homeMetadata: Metadata = {
  title: 'Ryza - Best Quality Muslim Fashion & Dresses in Hyderabad',
  description: 'Shop best quality hijabs, modest dresses, and Muslim fashion accessories in Hyderabad. Premium quality modest clothing for the modern Muslim woman.',
  keywords: [
    'hyderabad',
    'dress',
    'best quality',
    'muslim',
    'hijab hyderabad',
    'muslim fashion hyderabad',
    'best quality dress hyderabad',
    'modest fashion hyderabad',
    'hijab shop hyderabad',
    'muslim clothing hyderabad',
    'ladies dresses hyderabad',
    'best quality hijab',
    'premium hijab',
    'ryza hyderabad',
  ],
  openGraph: {
    title: 'Ryza - Best Quality Muslim Fashion & Dresses in Hyderabad',
    description: 'Shop best quality hijabs, modest dresses, and Muslim fashion accessories in Hyderabad.',
    url: siteUrl,
  },
}

export const productsMetadata: Metadata = {
  title: 'All Products - Best Quality Muslim Fashion in Hyderabad',
  description: 'Browse our complete collection of best quality hijabs, dresses, and Muslim fashion accessories in Hyderabad. Premium quality modest clothing.',
  keywords: [
    'hyderabad',
    'dress',
    'best quality',
    'muslim',
    'all products',
    'hijab collection hyderabad',
    'muslim fashion products',
    'best quality dresses',
    'modest clothing hyderabad',
    'hijab shop hyderabad',
  ],
  openGraph: {
    title: 'All Products - Best Quality Muslim Fashion in Hyderabad',
    description: 'Browse our complete collection of best quality hijabs, dresses, and Muslim fashion accessories.',
    url: `${siteUrl}/products`,
  },
}

export const shippingMetadata: Metadata = {
  title: 'Shipping Information - Free Shipping on Best Quality Muslim Fashion',
  description: 'Shipping information for best quality hijabs and Muslim fashion in Hyderabad. Free shipping available on orders.',
  keywords: [
    'hyderabad',
    'shipping',
    'free shipping',
    'muslim fashion shipping',
    'hijab delivery hyderabad',
    'best quality dress delivery',
  ],
  openGraph: {
    title: 'Shipping Information - Free Shipping Available',
    description: 'Shipping information for best quality hijabs and Muslim fashion in Hyderabad.',
    url: `${siteUrl}/shipping`,
  },
}

export const aboutMetadata: Metadata = {
  title: 'About Ryza - Best Quality Muslim Fashion Store in Hyderabad',
  description: 'Learn about Ryza - The Hijab House. Best quality Muslim fashion and modest clothing store in Hyderabad.',
  keywords: [
    'hyderabad',
    'about ryza',
    'muslim fashion store',
    'best quality hijab store',
    'hijab house hyderabad',
    'modest fashion hyderabad',
  ],
  openGraph: {
    title: 'About Ryza - Best Quality Muslim Fashion Store in Hyderabad',
    description: 'Learn about Ryza - The Hijab House. Best quality Muslim fashion and modest clothing store.',
    url: `${siteUrl}/about`,
  },
}

export const contactMetadata: Metadata = {
  title: 'Contact Us - Best Quality Muslim Fashion Store in Hyderabad',
  description: 'Contact Ryza for best quality hijabs and Muslim fashion in Hyderabad. Get in touch with us.',
  keywords: [
    'hyderabad',
    'contact',
    'muslim fashion contact',
    'hijab shop contact hyderabad',
    'best quality dress contact',
  ],
  openGraph: {
    title: 'Contact Us - Best Quality Muslim Fashion Store in Hyderabad',
    description: 'Contact Ryza for best quality hijabs and Muslim fashion in Hyderabad.',
    url: `${siteUrl}/contact`,
  },
}

