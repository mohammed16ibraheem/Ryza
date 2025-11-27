import { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theryza.com'

// Helper function to get products (storage removed)
async function getProductsFromStorage(): Promise<any[]> {
  // Storage service removed - return empty array
  return []
}

// Add timeout handling to prevent build failures
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

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

  // Fetch products for dynamic product pages with timeout protection
  try {
    // Add timeout to prevent hanging during build
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Sitemap generation timeout')), 10000) // 10 second timeout
    )
    
    const productsPromise = getProductsFromStorage()
    const products = await Promise.race([productsPromise, timeoutPromise]) as any[]

    if (!products || products.length === 0) {
      return staticPages
    }

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
    // Return static pages only if dynamic generation fails
    return staticPages
  }
}

