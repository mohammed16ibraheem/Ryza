import { NextRequest, NextResponse } from 'next/server'
import { del, put, list } from '@vercel/blob'

const PRODUCTS_BLOB_PATH = 'data/products.json'

// Helper function to get products from Blob storage
async function getProductsFromBlob(): Promise<any[]> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      console.warn('BLOB_READ_WRITE_TOKEN not set, returning empty products')
      return []
    }

    // Try to find the blob by listing with prefix
    const blobs = await list({ 
      prefix: PRODUCTS_BLOB_PATH,
      token,
      limit: 1
    })

    if (blobs.blobs.length === 0) {
      // Blob doesn't exist yet, return empty array
      return []
    }

    // Fetch the blob content using the URL
    const blobUrl = blobs.blobs[0].url
    const response = await fetch(blobUrl)
    
    if (!response.ok) {
      console.warn(`Failed to fetch products blob: ${response.statusText}`)
      return []
    }

    const text = await response.text()
    if (!text || text.trim() === '') {
      return []
    }

    return JSON.parse(text)
  } catch (error: any) {
    // If blob doesn't exist (404), return empty array
    if (error.status === 404 || error.code === 'ENOENT' || error.message?.includes('not found')) {
      return []
    }
    console.error('Error reading products from Blob:', error)
    // Return empty array on error to prevent crashes
    return []
  }
}

// Helper function to save products to Blob storage
async function saveProductsToBlob(products: any[]): Promise<void> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN not configured')
    }

    const jsonContent = JSON.stringify(products, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })

    // Check if blob already exists and delete it first (to update)
    try {
      const existingBlobs = await list({ 
        prefix: PRODUCTS_BLOB_PATH,
        token,
        limit: 1
      })
      
      if (existingBlobs.blobs.length > 0) {
        // Delete old blob before creating new one
        await del(existingBlobs.blobs[0].url, { token })
      }
    } catch (error) {
      // Ignore errors when trying to delete (blob might not exist)
      console.warn('Could not delete existing products blob:', error)
    }

    // Create/update the blob
    await put(PRODUCTS_BLOB_PATH, blob, {
      access: 'public',
      token,
      addRandomSuffix: false, // Keep same path for updates
    })
  } catch (error) {
    console.error('Error saving products to Blob:', error)
    throw error
  }
}

// Check if URL is a Vercel Blob URL
function isBlobUrl(url: string): boolean {
  return url.includes('blob.vercel-storage.com') || url.includes('public.blob.vercel-storage.com')
}

// GET - Fetch all products or filter by category
export async function GET(request: NextRequest) {
  try {
    const products = await getProductsFromBlob()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (category) {
      // Map URL category to database category
      const categoryMap: { [key: string]: string } = {
        'salah-essential': 'Salah Essential',
        'dresses': 'Salah Essential', // Legacy support - map old "dresses" URL to "Salah Essential"
        'hijabs': 'Hijabs',
        'gift-hampers': 'Gift Hampers',
        'hair-accessories': 'Hair Essentials',
        'hair-essentials': 'Hair Essentials',
        'jewellery': 'Jewellery',
        'offers': 'Offers',
      }
      
      // Decode category if it's URL encoded
      const decodedCategory = decodeURIComponent(category)
      const dbCategory = categoryMap[decodedCategory] || decodedCategory
      
      const filtered = products.filter((p: any) => {
        return p.category === dbCategory
      })
      return NextResponse.json({ products: filtered })
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ products: [] })
  }
}

// POST - Save a new product
export async function POST(request: NextRequest) {
  try {
    const product = await request.json()

    const products = await getProductsFromBlob()

    // Check if updating existing product
    const existingIndex = products.findIndex((p: any) => p.id === product.id)
    
    if (existingIndex >= 0) {
      products[existingIndex] = product
    } else {
      products.push(product)
    }

    await saveProductsToBlob(products)

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Error saving product:', error)
    return NextResponse.json(
      { error: 'Failed to save product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const products = await getProductsFromBlob()
    
    if (products.length === 0) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 })
    }

    const productIndex = products.findIndex((p: any) => p.id === productId)
    
    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = products[productIndex]
    
    // Delete all associated files from Vercel Blob
    try {
      const token = process.env.BLOB_READ_WRITE_TOKEN
      const deletedFiles: string[] = []

      // Delete product images from Blob
      if (product.images && Array.isArray(product.images)) {
        for (const imageUrl of product.images) {
          if (imageUrl && typeof imageUrl === 'string' && isBlobUrl(imageUrl)) {
            try {
              await del(imageUrl, { token })
              deletedFiles.push(imageUrl)
            } catch (err) {
              console.error(`Error deleting image from Blob ${imageUrl}:`, err)
            }
          }
        }
      }

      // Delete product video from Blob
      if (product.video && typeof product.video === 'string' && isBlobUrl(product.video)) {
        try {
          await del(product.video, { token })
          deletedFiles.push(product.video)
        } catch (err) {
          console.error(`Error deleting video from Blob ${product.video}:`, err)
        }
      }

      // Delete color variant images from Blob
      if (product.colorVariants && Array.isArray(product.colorVariants)) {
        for (const variant of product.colorVariants) {
          if (variant.images && Array.isArray(variant.images)) {
            for (const imageUrl of variant.images) {
              if (imageUrl && typeof imageUrl === 'string' && isBlobUrl(imageUrl)) {
                try {
                  await del(imageUrl, { token })
                  deletedFiles.push(imageUrl)
                } catch (err) {
                  console.error(`Error deleting color variant image from Blob ${imageUrl}:`, err)
                }
              }
            }
          }
        }
      }

      console.log(`Deleted ${deletedFiles.length} files from Blob for product ${productId}`)
    } catch (fileError) {
      console.error('Error deleting product files from Blob:', fileError)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    products.splice(productIndex, 1)
    await saveProductsToBlob(products)

    return NextResponse.json({ 
      success: true, 
      message: 'Product and associated files deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

