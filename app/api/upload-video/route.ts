import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('video') as File
    const category = formData.get('category') as string
    const subCategory = formData.get('subCategory') as string | null
    const productId = formData.get('productId') as string

    if (!file) {
      return NextResponse.json({ error: 'No video uploaded' }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // Generate folder path
    const basePath = path.join(process.cwd(), 'public', 'images')
    let folderPath = path.join(basePath, category.replace(/\s+/g, '-'))
    
    if (category === 'Hijabs' && subCategory) {
      folderPath = path.join(folderPath, subCategory.replace(/\s+/g, '-'))
    }

    // Create folder if it doesn't exist
    if (!existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${productId}_${timestamp}_video_${originalName}`
    const filePath = path.join(folderPath, fileName)

    await writeFile(filePath, buffer)
    
    // Return relative path for frontend
    const relativePath = `/images/${category.replace(/\s+/g, '-')}${subCategory ? `/${subCategory.replace(/\s+/g, '-')}` : ''}/${fileName}`

    return NextResponse.json({
      success: true,
      video: relativePath,
      folderPath: folderPath.replace(process.cwd(), ''),
    })
  } catch (error) {
    console.error('Video upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

