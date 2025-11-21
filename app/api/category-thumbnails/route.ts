import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { put, del } from '@vercel/blob'

// Database file for category thumbnails
const THUMBNAILS_DB_FILE = path.join(process.cwd(), 'data', 'category-thumbnails.json')

// Ensure data directory exists (for local JSON storage)
async function ensureDataDir() {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }
  } catch (error) {
    // Ignore errors
  }
}

// GET - Fetch all category thumbnails
export async function GET() {
  try {
    await ensureDataDir()
    
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
  try {
    await ensureDataDir()
    
    const formData = await request.formData()
    const category = formData.get('category') as string
    const file = formData.get('file') as File

    if (!category || !file) {
      return NextResponse.json({ error: 'Category and file are required' }, { status: 400 })
    }

    // Check for Blob token
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return NextResponse.json(
        { error: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.' },
        { status: 500 }
      )
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

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileExtension = path.extname(originalName)
    const baseName = path.basename(originalName, fileExtension)
    const fileName = `${category}_${timestamp}_${baseName}${fileExtension}`
    const blobPath = `images/category-thumbnails/${fileName}`

    // Upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: 'public',
      token,
    })

    // Read existing database
    let thumbnails: { [key: string]: string } = {}
    if (existsSync(THUMBNAILS_DB_FILE)) {
      const fileContent = await readFile(THUMBNAILS_DB_FILE, 'utf-8')
      thumbnails = JSON.parse(fileContent)
    }
    
    // Delete old thumbnail from Blob if exists (to save space)
    if (thumbnails[category]) {
      try {
        // Extract blob path from URL
        const oldUrl = thumbnails[category]
        // Vercel Blob URLs are in format: https://[hash].public.blob.vercel-storage.com/[path]
        // We need to extract the path or use the URL directly
        // For now, we'll try to delete using the URL
        await del(oldUrl, { token })
      } catch (err) {
        // Ignore errors when deleting old file
        console.warn('Could not delete old thumbnail from Blob:', err)
      }
    }
    
    // Update database with new thumbnail URL
    thumbnails[category] = blob.url
    
    // Save to database
    await writeFile(THUMBNAILS_DB_FILE, JSON.stringify(thumbnails, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      thumbnail: blob.url,
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
  try {
    await ensureDataDir()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // Check for Blob token
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return NextResponse.json(
        { error: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.' },
        { status: 500 }
      )
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

    // Delete from Vercel Blob
    try {
      await del(thumbnails[category], { token })
    } catch (err) {
      console.warn('Could not delete thumbnail from Blob:', err)
      // Continue with database deletion even if Blob deletion fails
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
