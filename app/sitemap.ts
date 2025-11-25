import { MetadataRoute } from 'next'
import { list } from '@vercel/blob'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theryza.com'
const PRODUCTS_BLOB_PATH = 'data/products.json'

// Helper function to get products from Blob storage (same as API route)
async function getProductsFromBlob(): Promise<any[]> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return []
    }

    const blobs = await list({ 
      prefix: PRODUCTS_BLOB_PATH,
      token,
      limit: 1
    })

    if (blobs.blobs.length === 0) {
      return []
    }

    const blobUrl = blobs.blobs[0].url
    const response = await fetch(blobUrl)
    
    if (!response.ok) {
      return []
    }

    const text = await response.text()
    if (!text || text.trim() === '') {
      return []
    }

    return JSON.parse(text)
  } catch (error: any) {
    if (error.status === 404 || error.code === 'ENOENT' || error.message?.includes('not found')) {
      return []
    }
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/shipping`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // Fetch products for dynamic product pages
  try {
    const products = await getProductsFromBlob()

    const productPages: MetadataRoute.Sitemap = products.map((product: any) => {
      const category = product.category?.toLowerCase().replace(/\s+/g, '-') || 'products'
      return {
        url: `${siteUrl}/products/${category}/${product.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }
    })

    // Fetch categories for category pages
    const categories = Array.from(
      new Set(products.map((p: any) => p.category?.toLowerCase().replace(/\s+/g, '-')).filter(Boolean))
    )

    const categoryPages: MetadataRoute.Sitemap = categories.map((category: string) => ({
      url: `${siteUrl}/products/${category}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }))

    return [...staticPages, ...categoryPages, ...productPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticPages
  }
}

