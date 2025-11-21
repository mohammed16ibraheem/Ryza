import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const category = formData.get('category') as string
    const subCategory = formData.get('subCategory') as string | null
    const productId = formData.get('productId') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

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

    // Map category names to folder names
    const getCategoryFolderName = (cat: string): string => {
      const categoryMap: { [key: string]: string } = {
        'Salah Essential': 'Salah-Essential',
        'Hijabs': 'Hijabs',
        'Gift Hampers': 'Gift-Hampers',
        'Hair Essentials': 'Hair-Essentials',
        'Hair Accessories': 'Hair-Essentials',
        'Jewellery': 'Jewellery',
        'Offers': 'Offers',
        'Dresses': 'Salah-Essential',
      }
      return categoryMap[cat] || cat.replace(/\s+/g, '-')
    }

    // Map Hijab sub-category to folder name
    const getHijabSubCategoryFolderName = (subCat: string): string => {
      const subCategoryMap: { [key: string]: string } = {
        'Hijab': 'Hijab',
        'Accessory': 'Hijab-Essentials',
        'Luxury': 'Luxury-Hijabs',
        'Day to Day Life': 'Day-to-Day-Life',
      }
      return subCategoryMap[subCat] || subCat.replace(/\s+/g, '-')
    }

    // Generate folder path for Blob storage
    const categoryFolder = getCategoryFolderName(category)
    let blobPath = `images/${categoryFolder}`
    
    if (category === 'Hijabs' && subCategory) {
      const subFolder = getHijabSubCategoryFolderName(subCategory)
      blobPath = `${blobPath}/${subFolder}`
    }

    const uploadedFiles: string[] = []

    // Upload each file to Vercel Blob
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Generate unique filename
      const timestamp = Date.now()
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${productId}_${timestamp}_${i}_${originalName}`
      const fullPath = `${blobPath}/${fileName}`

      // Upload to Vercel Blob
      const blob = await put(fullPath, file, {
        access: 'public',
        token,
      })

      uploadedFiles.push(blob.url)
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      folderPath: blobPath,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
