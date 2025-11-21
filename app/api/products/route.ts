import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { del } from '@vercel/blob'

const PRODUCTS_FILE = path.join(process.cwd(), 'data', 'products.json')

// Ensure data directory exists
async function ensureDataDir() {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }
  } catch (error) {
    // Silently fail
  }
}

// Check if URL is a Vercel Blob URL
function isBlobUrl(url: string): boolean {
  return url.includes('blob.vercel-storage.com') || url.includes('public.blob.vercel-storage.com')
}

// GET - Fetch all products or filter by category
export async function GET(request: NextRequest) {
  try {
    await ensureDataDir()
    
    if (!existsSync(PRODUCTS_FILE)) {
      return NextResponse.json({ products: [] })
    }

    const fileContent = await readFile(PRODUCTS_FILE, 'utf-8')
    const products = JSON.parse(fileContent)

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
    await ensureDataDir()
    
    const product = await request.json()

    let products = []
    if (existsSync(PRODUCTS_FILE)) {
      const fileContent = await readFile(PRODUCTS_FILE, 'utf-8')
      products = JSON.parse(fileContent)
    }

    // Check if updating existing product
    const existingIndex = products.findIndex((p: any) => p.id === product.id)
    
    if (existingIndex >= 0) {
      products[existingIndex] = product
    } else {
      products.push(product)
    }

    await writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8')

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
    await ensureDataDir()
    
    if (!existsSync(PRODUCTS_FILE)) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const fileContent = await readFile(PRODUCTS_FILE, 'utf-8')
    const products = JSON.parse(fileContent)

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
    await writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8')

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

