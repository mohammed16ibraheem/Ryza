import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { put, del, list } from '@vercel/blob'

const THUMBNAILS_BLOB_PATH = 'data/category-thumbnails.json'

// Helper function to get thumbnails from Blob storage
async function getThumbnailsFromBlob(): Promise<{ [key: string]: string }> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      console.warn('BLOB_READ_WRITE_TOKEN not set, returning empty thumbnails')
      return {}
    }

    // Try to find the blob by listing with prefix
    const blobs = await list({ 
      prefix: THUMBNAILS_BLOB_PATH,
      token,
      limit: 1
    })

    if (blobs.blobs.length === 0) {
      // Blob doesn't exist yet, return empty object
      return {}
    }

    // Fetch the blob content using the URL
    const blobUrl = blobs.blobs[0].url
    const response = await fetch(blobUrl)
    
    if (!response.ok) {
      console.warn(`Failed to fetch thumbnails blob: ${response.statusText}`)
      return {}
    }

    const text = await response.text()
    if (!text || text.trim() === '') {
      return {}
    }

    return JSON.parse(text)
  } catch (error: any) {
    // If blob doesn't exist (404), return empty object
    if (error.status === 404 || error.code === 'ENOENT' || error.message?.includes('not found')) {
      return {}
    }
    console.error('Error reading thumbnails from Blob:', error)
    return {}
  }
}

// Helper function to save thumbnails to Blob storage
async function saveThumbnailsToBlob(thumbnails: { [key: string]: string }): Promise<void> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN not configured')
    }

    const jsonContent = JSON.stringify(thumbnails, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })

    // Check if blob already exists and delete it first (to update)
    try {
      const existingBlobs = await list({ 
        prefix: THUMBNAILS_BLOB_PATH,
        token,
        limit: 1
      })
      
      if (existingBlobs.blobs.length > 0) {
        // Delete old blob before creating new one
        await del(existingBlobs.blobs[0].url, { token })
      }
    } catch (error) {
      // Ignore errors when trying to delete (blob might not exist)
      console.warn('Could not delete existing thumbnails blob:', error)
    }

    // Create/update the blob
    await put(THUMBNAILS_BLOB_PATH, blob, {
      access: 'public',
      token,
      addRandomSuffix: false, // Keep same path for updates
    })
  } catch (error) {
    console.error('Error saving thumbnails to Blob:', error)
    throw error
  }
}

// GET - Fetch all category thumbnails
export async function GET() {
  try {
    const thumbnails = await getThumbnailsFromBlob()
    return NextResponse.json({ thumbnails })
  } catch (error) {
    console.error('Error fetching thumbnails:', error)
    return NextResponse.json({ thumbnails: {} })
  }
}

// POST - Save category thumbnail
export async function POST(request: NextRequest) {
  try {
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

    // Read existing database from Blob
    const thumbnails = await getThumbnailsFromBlob()
    
    // Delete old thumbnail from Blob if exists (to save space)
    if (thumbnails[category]) {
      try {
        const oldUrl = thumbnails[category]
        await del(oldUrl, { token })
      } catch (err) {
        // Ignore errors when deleting old file
        console.warn('Could not delete old thumbnail from Blob:', err)
      }
    }
    
    // Update database with new thumbnail URL
    thumbnails[category] = blob.url
    
    // Save to database (Blob storage)
    await saveThumbnailsToBlob(thumbnails)

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

    // Read database from Blob
    const thumbnails = await getThumbnailsFromBlob()

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
    await saveThumbnailsToBlob(thumbnails)

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
