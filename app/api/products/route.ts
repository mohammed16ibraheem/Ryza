import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir, unlink, rmdir } from 'fs/promises'
import { existsSync, readdirSync, statSync } from 'fs'
import path from 'path'

const PRODUCTS_FILE = path.join(process.cwd(), 'data', 'products.json')

// Check if running on Vercel (serverless environment)
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV

// Ensure data directory exists
async function ensureDataDir() {
  // On Vercel, file system is read-only, skip directory creation
  if (isVercel) {
    return
  }
  
  try {
    const dataDir = path.join(process.cwd(), 'data')
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }
  } catch (error) {
    // Silently fail on Vercel
    if (isVercel) return
    throw error
  }
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
  // On Vercel, file system is read-only - return helpful error
  if (isVercel) {
    return NextResponse.json(
      { 
        error: 'File storage not available on Vercel', 
        message: 'Product uploads require a database. Please migrate to Vercel Postgres, MongoDB, or another database service.',
        vercel: true
      },
      { status: 503 }
    )
  }

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
  // On Vercel, file system is read-only - return helpful error
  if (isVercel) {
    return NextResponse.json(
      { 
        error: 'File storage not available on Vercel', 
        message: 'Product deletion requires a database. Please migrate to Vercel Postgres, MongoDB, or another database service.',
        vercel: true
      },
      { status: 503 }
    )
  }

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
    
    // Delete all associated files
    try {
      const publicPath = path.join(process.cwd(), 'public')
      const deletedFiles: string[] = []

      // Delete product images
      if (product.images && Array.isArray(product.images)) {
        for (const imagePath of product.images) {
          if (imagePath && typeof imagePath === 'string') {
            const fullPath = path.join(publicPath, imagePath)
            if (existsSync(fullPath)) {
              try {
                await unlink(fullPath)
                deletedFiles.push(imagePath)
              } catch (err) {
                console.error(`Error deleting image ${imagePath}:`, err)
              }
            }
          }
        }
      }

      // Delete product video
      if (product.video && typeof product.video === 'string') {
        const videoPath = path.join(publicPath, product.video)
        if (existsSync(videoPath)) {
          try {
            await unlink(videoPath)
            deletedFiles.push(product.video)
          } catch (err) {
            console.error(`Error deleting video ${product.video}:`, err)
          }
        }
      }

      // Delete color variant images
      if (product.colorVariants && Array.isArray(product.colorVariants)) {
        for (const variant of product.colorVariants) {
          if (variant.images && Array.isArray(variant.images)) {
            for (const imagePath of variant.images) {
              if (imagePath && typeof imagePath === 'string') {
                const fullPath = path.join(publicPath, imagePath)
                if (existsSync(fullPath)) {
                  try {
                    await unlink(fullPath)
                    deletedFiles.push(imagePath)
                  } catch (err) {
                    console.error(`Error deleting color variant image ${imagePath}:`, err)
                  }
                }
              }
            }
          }
        }
      }

      // Helper function to recursively delete empty folders
      const deleteEmptyFolders = async (dirPath: string): Promise<void> => {
        try {
          if (!existsSync(dirPath)) return
          
          const files = readdirSync(dirPath)
          
          // If folder is empty, try to delete it
          if (files.length === 0) {
            try {
              await rmdir(dirPath)
              console.log(`Deleted empty folder: ${dirPath}`)
              
              // Try to delete parent folder if it becomes empty
              const parentDir = path.dirname(dirPath)
              if (parentDir !== publicPath && parentDir !== path.join(publicPath, 'images')) {
                await deleteEmptyFolders(parentDir)
              }
            } catch (err) {
              // Folder might not be empty or permission issue, ignore
            }
          }
        } catch (err) {
          // Ignore errors for folder deletion
        }
      }

      // Try to delete the product's folder if it's empty
      if (product.folderPath) {
        const folderPath = path.join(publicPath, product.folderPath)
        await deleteEmptyFolders(folderPath)
      }

      console.log(`Deleted ${deletedFiles.length} files for product ${productId}`)
    } catch (fileError) {
      console.error('Error deleting product files:', fileError)
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

