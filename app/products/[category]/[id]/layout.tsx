import { Metadata } from 'next'
import { list } from '@vercel/blob'

// Force dynamic rendering for product pages to prevent build timeouts
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

export async function generateMetadata({ params }: { params: { category: string; id: string } }): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theryza.com'
  
  // Fetch product data to generate dynamic metadata with timeout protection
  try {
    // Add timeout to prevent hanging during build
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Metadata generation timeout')), 5000) // 5 second timeout
    )
    
    const productsPromise = getProductsFromBlob()
    const products = await Promise.race([productsPromise, timeoutPromise]) as any[]
    
    const categoryMap: { [key: string]: string } = {
      'salah-essential': 'Salah Essential',
      'dresses': 'Salah Essential',
      'hijabs': 'Hijabs',
      'gift-hampers': 'Gift Hampers',
      'hair-accessories': 'Hair Essentials',
      'hair-essentials': 'Hair Essentials',
      'jewellery': 'Jewellery',
      'offers': 'Offers',
    }
    
    const apiCategory = categoryMap[params.category] || params.category
    const filteredProducts = products.filter((p: any) => p.category === apiCategory)
    const product = filteredProducts.find((p: any) => p.id === params.id)
    
    if (product) {
      const productName = product.name || product.title || 'Product'
      const description = product.description || `Best quality ${productName} in Hyderabad. Premium Muslim fashion.`
      
      return {
        title: `${productName} - Best Quality Muslim Fashion in Hyderabad | Ryza`,
        description: `${description} Shop best quality ${productName} in Hyderabad. Premium quality Muslim fashion and modest clothing.`,
        keywords: [
          'hyderabad',
          'dress',
          'best quality',
          'muslim',
          productName.toLowerCase(),
          'hijab hyderabad',
          'muslim fashion hyderabad',
          'best quality dress',
          'modest fashion',
        ],
        openGraph: {
          title: `${productName} - Best Quality Muslim Fashion in Hyderabad`,
          description: description,
          url: `${siteUrl}/products/${params.category}/${params.id}`,
          images: product.images && product.images.length > 0 ? [{ url: product.images[0] }] : undefined,
        },
        twitter: {
          card: 'summary_large_image',
          title: `${productName} - Best Quality Muslim Fashion in Hyderabad`,
          description: description,
          images: product.images && product.images.length > 0 ? [product.images[0]] : undefined,
        },
      }
    }
  } catch (error) {
    console.error('Error generating product metadata:', error)
  }
  
  // Fallback metadata
  return {
    title: 'Product - Best Quality Muslim Fashion in Hyderabad | Ryza',
    description: 'Shop best quality Muslim fashion and modest clothing in Hyderabad. Premium quality hijabs and dresses.',
    keywords: [
      'hyderabad',
      'dress',
      'best quality',
      'muslim',
      'product',
      'hijab hyderabad',
      'muslim fashion',
    ],
  }
}

export default function ProductDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

