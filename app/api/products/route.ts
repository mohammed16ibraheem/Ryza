import { NextRequest, NextResponse } from 'next/server'
import { uploadToGitHub, deleteFromGitHub } from '@/lib/github-storage'

const PRODUCTS_FILE_PATH = 'public/data/products.json'

// Helper function to get products from GitHub
async function getProductsFromStorage(): Promise<any[]> {
  try {
    const config = {
      token: process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      branch: process.env.GITHUB_BRANCH || 'main',
    }

    if (!config.token || !config.owner || !config.repo) {
      console.warn('GitHub storage not configured - returning empty products')
      return []
    }

    // For public repos, use raw.githubusercontent.com (faster)
    // For private repos, use GitHub API with auth
    const rawUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${PRODUCTS_FILE_PATH}`
    const response = await fetch(rawUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        // File doesn't exist yet, return empty array
        return []
      }
      // If raw URL fails (private repo), try API method
      try {
        const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${PRODUCTS_FILE_PATH}?ref=${config.branch}`
        const apiResponse = await fetch(apiUrl, {
          headers: {
            'Authorization': `token ${config.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        })
        
        if (apiResponse.ok) {
          const apiData = await apiResponse.json()
          if (apiData.content) {
            const text = Buffer.from(apiData.content, 'base64').toString('utf-8')
            const products = JSON.parse(text)
            return Array.isArray(products) ? products : []
          }
        }
      } catch (apiError) {
        console.warn('API fallback failed:', apiError)
      }
      
      console.warn(`Failed to fetch products: ${response.statusText}`)
      return []
    }

    const text = await response.text()
    if (!text || text.trim() === '') {
      return []
    }

    const products = JSON.parse(text)
    return Array.isArray(products) ? products : []
  } catch (error: any) {
    if (error.message?.includes('JSON') || error.message?.includes('parse')) {
      console.error('Error parsing products JSON:', error)
      return []
    }
    console.error('Error reading products from GitHub:', error)
    return []
  }
}

// Helper function to save products to GitHub
async function saveProductsToStorage(products: any[]): Promise<void> {
  const config = {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_REPO_OWNER,
    repo: process.env.GITHUB_REPO_NAME,
    branch: process.env.GITHUB_BRANCH || 'main',
  }

  if (!config.token || !config.owner || !config.repo) {
    throw new Error('GitHub storage not configured. Please set GITHUB_TOKEN, GITHUB_REPO_OWNER, and GITHUB_REPO_NAME environment variables.')
  }

  // Convert products array to JSON string
  const jsonContent = JSON.stringify(products, null, 2)
  
  // Create a Blob from the JSON string
  const blob = new Blob([jsonContent], { type: 'application/json' })
  
  // Upload to GitHub using the uploadToGitHub function
  // We need to convert the blob to a format that can be uploaded
  // Since uploadToGitHub expects File | Blob, we can pass the blob directly
  await uploadToGitHub(
    blob,
    PRODUCTS_FILE_PATH,
    `Update products database - ${new Date().toISOString()}`
  )
}

// GET - Fetch all products or filter by category
export async function GET(request: NextRequest) {
  try {
    const products = await getProductsFromStorage()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (category) {
      // Map URL category to database category
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

    const products = await getProductsFromStorage()

    // Check if updating existing product
    const existingIndex = products.findIndex((p: any) => p.id === product.id)
    
    if (existingIndex >= 0) {
      products[existingIndex] = product
    } else {
      products.push(product)
    }

    await saveProductsToStorage(products)

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Error saving product:', error)
    return NextResponse.json(
      { error: 'Failed to save product - storage service not configured', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
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

    const products = await getProductsFromStorage()
    
    if (products.length === 0) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 })
    }

    const productIndex = products.findIndex((p: any) => p.id === productId)
    
    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete from database
    products.splice(productIndex, 1)
    await saveProductsToStorage(products)

    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product - storage service not configured', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    )
  }
}

