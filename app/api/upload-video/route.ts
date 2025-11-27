import { NextRequest, NextResponse } from 'next/server'
import { uploadToGitHub } from '@/lib/github-storage'

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

    // Generate folder path for GitHub storage
    const categoryFolder = getCategoryFolderName(category)
    let basePath = `public/images/${categoryFolder}`
    
    if (category === 'Hijabs' && subCategory) {
      const subFolder = getHijabSubCategoryFolderName(subCategory)
      basePath = `${basePath}/${subFolder}`
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${productId}_${timestamp}_video_${originalName}`
    const filePath = `${basePath}/${fileName}`

    // Upload video to GitHub
    const result = await uploadToGitHub(
      file,
      filePath,
      `Upload product video for ${productId}`
    )

    const folderPath = basePath.replace('public/', '')

    return NextResponse.json({
      success: true,
      video: result.url,
      folderPath: folderPath,
    })
  } catch (error) {
    console.error('Video upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
