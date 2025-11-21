import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// Database file for category thumbnails
const THUMBNAILS_DB_FILE = path.join(process.cwd(), 'data', 'category-thumbnails.json')
// Storage directory for category thumbnail images
const THUMBNAILS_STORAGE_DIR = path.join(process.cwd(), 'public', 'images', 'category-thumbnails')

// Check if running on Vercel (serverless environment)
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV

// Ensure directories exist
async function ensureDirs() {
  if (isVercel) return
  
  try {
    const dataDir = path.join(process.cwd(), 'data')
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }
    
    if (!existsSync(THUMBNAILS_STORAGE_DIR)) {
      await mkdir(THUMBNAILS_STORAGE_DIR, { recursive: true })
    }
  } catch (error) {
    if (isVercel) return
    throw error
  }
}

// GET - Fetch all category thumbnails
export async function GET() {
  try {
    await ensureDirs()
    
    // Read from database
    if (!existsSync(THUMBNAILS_DB_FILE)) {
      return NextResponse.json({ thumbnails: {} })
    }

    const fileContent = await readFile(THUMBNAILS_DB_FILE, 'utf-8')
    const thumbnails = JSON.parse(fileContent)
    
    return NextResponse.json({ thumbnails })
  } catch (error) {
    console.error('Error fetching thumbnails:', error)
    return NextResponse.json({ thumbnails: {} })
  }
}

// POST - Save category thumbnail
export async function POST(request: NextRequest) {
  if (isVercel) {
    return NextResponse.json(
      { 
        error: 'File storage not available on Vercel', 
        message: 'Category thumbnail uploads require cloud storage. Please migrate to Vercel Blob, Cloudinary, or AWS S3.',
        vercel: true
      },
      { status: 503 }
    )
  }

  try {
    await ensureDirs()
    
    const formData = await request.formData()
    const category = formData.get('category') as string
    const file = formData.get('file') as File

    if (!category || !file) {
      return NextResponse.json({ error: 'Category and file are required' }, { status: 400 })
    }

    // Validate category
    const validCategories = [
      'salah-essential',
      'hijabs',
      'gift-hampers',
      'hair-essentials',
      'jewellery',
      'offers'
    ]
    
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Generate unique filename with category key
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileExtension = path.extname(originalName)
    const baseName = path.basename(originalName, fileExtension)
    const fileName = `${category}_${timestamp}_${baseName}${fileExtension}`
    const filePath = path.join(THUMBNAILS_STORAGE_DIR, fileName)
    
    // Save image file to storage
    await writeFile(filePath, buffer)
    
    // Database entry: relative path from public folder
    const relativePath = `/images/category-thumbnails/${fileName}`
    
    // Read existing database
    let thumbnails: { [key: string]: string } = {}
    if (existsSync(THUMBNAILS_DB_FILE)) {
      const fileContent = await readFile(THUMBNAILS_DB_FILE, 'utf-8')
      thumbnails = JSON.parse(fileContent)
    }
    
    // Delete old thumbnail file if exists (to save space)
    if (thumbnails[category]) {
      const oldFilePath = path.join(process.cwd(), 'public', thumbnails[category])
      if (existsSync(oldFilePath)) {
        try {
          await unlink(oldFilePath)
        } catch (err) {
          // Ignore errors when deleting old file
          console.warn('Could not delete old thumbnail:', err)
        }
      }
    }
    
    // Update database with new thumbnail path
    thumbnails[category] = relativePath
    
    // Save to database
    await writeFile(THUMBNAILS_DB_FILE, JSON.stringify(thumbnails, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      thumbnail: relativePath,
      category
    })
  } catch (error) {
    console.error('Error saving thumbnail:', error)
    return NextResponse.json(
      { error: 'Failed to save thumbnail', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a category thumbnail
export async function DELETE(request: NextRequest) {
  if (isVercel) {
    return NextResponse.json(
      { 
        error: 'File storage not available on Vercel', 
        message: 'Category thumbnail deletion requires cloud storage.',
        vercel: true
      },
      { status: 503 }
    )
  }

  try {
    await ensureDirs()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // Validate category
    const validCategories = [
      'salah-essential',
      'hijabs',
      'gift-hampers',
      'hair-essentials',
      'jewellery',
      'offers'
    ]
    
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Read database
    if (!existsSync(THUMBNAILS_DB_FILE)) {
      return NextResponse.json({ error: 'No thumbnails found' }, { status: 404 })
    }

    const fileContent = await readFile(THUMBNAILS_DB_FILE, 'utf-8')
    const thumbnails = JSON.parse(fileContent)

    if (!thumbnails[category]) {
      return NextResponse.json({ error: 'Thumbnail not found for this category' }, { status: 404 })
    }

    // Delete image file
    const imagePath = path.join(process.cwd(), 'public', thumbnails[category])
    if (existsSync(imagePath)) {
      try {
        await unlink(imagePath)
      } catch (err) {
        console.warn('Could not delete thumbnail file:', err)
      }
    }

    // Remove from database
    delete thumbnails[category]
    await writeFile(THUMBNAILS_DB_FILE, JSON.stringify(thumbnails, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      message: 'Thumbnail deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting thumbnail:', error)
    return NextResponse.json(
      { error: 'Failed to delete thumbnail', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

