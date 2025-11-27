import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { uploadToGitHub, deleteFromGitHub } from '@/lib/github-storage'

const THUMBNAILS_FILE_PATH = 'public/data/category-thumbnails.json'

// Helper function to get thumbnails from GitHub
async function getThumbnailsFromStorage(): Promise<{ [key: string]: string }> {
  try {
    const config = {
      token: process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      branch: process.env.GITHUB_BRANCH || 'main',
    }

    if (!config.token || !config.owner || !config.repo) {
      return {}
    }

    // For public repos, use raw.githubusercontent.com (faster)
    const rawUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${THUMBNAILS_FILE_PATH}`
    const response = await fetch(rawUrl, {
      cache: 'no-store',
    })

    if (!response.ok) {
      if (response.status === 404) return {}
      // Fallback to API for private repos
      try {
        const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${THUMBNAILS_FILE_PATH}?ref=${config.branch}`
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
            return JSON.parse(text)
          }
        }
      } catch {}
      return {}
    }

    const text = await response.text()
    if (!text || text.trim() === '') return {}

    return JSON.parse(text)
  } catch (error) {
    console.error('Error reading thumbnails from GitHub:', error)
    return {}
  }
}

// Helper function to save thumbnails to GitHub
async function saveThumbnailsToStorage(thumbnails: { [key: string]: string }): Promise<void> {
  const config = {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_REPO_OWNER,
    repo: process.env.GITHUB_REPO_NAME,
    branch: process.env.GITHUB_BRANCH || 'main',
  }

  if (!config.token || !config.owner || !config.repo) {
    throw new Error('GitHub storage not configured')
  }

  const jsonContent = JSON.stringify(thumbnails, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  
  await uploadToGitHub(
    blob,
    THUMBNAILS_FILE_PATH,
    `Update category thumbnails - ${new Date().toISOString()}`
  )
}

// GET - Fetch all category thumbnails
export async function GET() {
  try {
    const thumbnails = await getThumbnailsFromStorage()
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

    // Upload thumbnail image to GitHub
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileExtension = path.extname(originalName)
    const baseName = path.basename(originalName, fileExtension)
    const fileName = `${category}_${timestamp}_${baseName}${fileExtension}`
    const imagePath = `public/images/category-thumbnails/${fileName}`

    // Upload image to GitHub
    const uploadResult = await uploadToGitHub(
      file,
      imagePath,
      `Upload category thumbnail for ${category}`
    )

    // Read existing thumbnails
    const thumbnails = await getThumbnailsFromStorage()
    
    // Delete old thumbnail from GitHub if exists
    if (thumbnails[category]) {
      try {
        // Extract path from URL
        // URL format: https://theryza.com/api/images/public/images/category-thumbnails/...
        const oldUrl = thumbnails[category]
        let oldPath = ''
        
        if (oldUrl.includes('/api/images/')) {
          // Extract path after /api/images/
          const pathMatch = oldUrl.match(/\/api\/images\/(.+)$/)
          if (pathMatch) {
            oldPath = pathMatch[1]
          }
        } else if (oldUrl.includes('raw.githubusercontent.com')) {
          // Legacy format: extract path after branch name
          const pathMatch = oldUrl.match(/\/main\/(.+)$/)
          if (pathMatch) {
            oldPath = pathMatch[1]
          }
        }
        
        if (oldPath) {
          await deleteFromGitHub(oldPath, `Delete old thumbnail for ${category}`)
        }
      } catch (err) {
        console.warn('Could not delete old thumbnail:', err)
        // Continue even if deletion fails
      }
    }
    
    // Update thumbnails database
    thumbnails[category] = uploadResult.url
    
    // Save thumbnails database to GitHub
    await saveThumbnailsToStorage(thumbnails)

    return NextResponse.json({
      success: true,
      thumbnail: uploadResult.url,
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
    const thumbnails = await getThumbnailsFromStorage()

    if (!thumbnails[category]) {
      return NextResponse.json({ error: 'Thumbnail not found for this category' }, { status: 404 })
    }

    // Delete thumbnail image file from GitHub permanently
    const thumbnailUrl = thumbnails[category]
    try {
      // Extract path from URL
      let filePath = ''
      
      if (thumbnailUrl.includes('/api/images/')) {
        // Extract path after /api/images/
        const pathMatch = thumbnailUrl.match(/\/api\/images\/(.+)$/)
        if (pathMatch) {
          filePath = pathMatch[1]
        }
      } else if (thumbnailUrl.includes('raw.githubusercontent.com')) {
        // Extract path after branch name
        const pathMatch = thumbnailUrl.match(/\/main\/(.+)$/)
        if (pathMatch) {
          filePath = pathMatch[1]
        }
      }
      
      if (filePath) {
        await deleteFromGitHub(filePath, `Delete category thumbnail for ${category}`)
        console.log(`Deleted thumbnail file: ${filePath}`)
      }
    } catch (err) {
      console.warn('Could not delete thumbnail file from GitHub:', err)
      // Continue with database deletion even if file deletion fails
    }

    // Remove from database
    delete thumbnails[category]
    await saveThumbnailsToStorage(thumbnails)

    return NextResponse.json({
      success: true,
      message: 'Thumbnail deleted permanently from GitHub'
    })
  } catch (error) {
    console.error('Error deleting thumbnail:', error)
    return NextResponse.json(
      { error: 'Failed to delete thumbnail - storage service not configured', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    )
  }
}
