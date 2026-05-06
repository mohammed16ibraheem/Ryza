import { NextRequest, NextResponse } from 'next/server'
import { uploadMultipleToGitHub } from '@/lib/github-storage'

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

    // Generate folder path for GitHub storage
    const categoryFolder = getCategoryFolderName(category)
    let basePath = `public/images/${categoryFolder}`
    
    if (category === 'Hijabs' && subCategory) {
      const subFolder = getHijabSubCategoryFolderName(subCategory)
      basePath = `${basePath}/${subFolder}`
    }

    // Upload files to GitHub
    const results = await uploadMultipleToGitHub(
      files,
      basePath,
      `Upload product images for ${productId}`
    )

    const uploadedFiles = results.map(r => r.url)
    const folderPath = basePath.replace('public/', '')

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      folderPath: folderPath,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
