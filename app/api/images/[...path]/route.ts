import { NextRequest, NextResponse } from 'next/server'

/**
 * Image Proxy API
 * Proxies images from private GitHub repository
 * Usage: /api/images/public/images/Salah-Essential/123_image.jpg
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const config = {
      token: process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      branch: process.env.GITHUB_BRANCH || 'main',
    }

    if (!config.token || !config.owner || !config.repo) {
      return NextResponse.json(
        { error: 'GitHub storage not configured' },
        { status: 500 }
      )
    }

    // Reconstruct the file path from the array
    const filePath = params.path.join('/')
    
    // Fetch image from GitHub API
    const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}?ref=${config.branch}`
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    const data = await response.json()
    
    if (!data.content) {
      return NextResponse.json(
        { error: 'Image content not found' },
        { status: 404 }
      )
    }

    // Decode base64 content
    const imageBuffer = Buffer.from(data.content, 'base64')
    
    // Determine content type from file extension
    const extension = filePath.split('.').pop()?.toLowerCase()
    const contentType = 
      extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
      extension === 'png' ? 'image/png' :
      extension === 'gif' ? 'image/gif' :
      extension === 'webp' ? 'image/webp' :
      extension === 'svg' ? 'image/svg+xml' :
      'image/jpeg' // Default

    // Return image with proper headers and caching
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': imageBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error proxying image:', error)
    return NextResponse.json(
      { error: 'Failed to load image' },
      { status: 500 }
    )
  }
}

