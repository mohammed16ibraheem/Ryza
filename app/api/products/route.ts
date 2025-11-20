import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const PRODUCTS_FILE = path.join(process.cwd(), 'data', 'products.json')

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true })
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
      const filtered = products.filter((p: any) => {
        // Map URL category to database category
        const categoryMap: { [key: string]: string } = {
          'dresses': 'Dresses',
          'hijabs': 'Hijabs',
          'gift-hampers': 'Gift Hampers',
          'hair-accessories': 'Hair Accessories',
          'offers': 'Offers',
        }
        
        const dbCategory = categoryMap[category] || category
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

    products.splice(productIndex, 1)
    await writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8')

    return NextResponse.json({ success: true, message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

