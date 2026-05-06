import { NextRequest, NextResponse } from 'next/server'

/**
 * Media Proxy API (Images & Videos)
 * Proxies media files from private GitHub repository
 * Usage: /api/images/public/images/Salah-Essential/123_image.jpg
 *        /api/images/public/images/Salah-Essential/123_video.webm
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
    
    // Fetch file from GitHub API
    const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}?ref=${config.branch}`
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    const data = await response.json()
    
    if (!data.content) {
      return NextResponse.json(
        { error: 'File content not found' },
        { status: 404 }
      )
    }

    // Decode base64 content
    const fileBuffer = Buffer.from(data.content, 'base64')
    
    // Determine content type from file extension
    const extension = filePath.split('.').pop()?.toLowerCase()
    const contentType = 
      // Images
      extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
      extension === 'png' ? 'image/png' :
      extension === 'gif' ? 'image/gif' :
      extension === 'webp' ? 'image/webp' :
      extension === 'svg' ? 'image/svg+xml' :
      // Videos
      extension === 'mp4' ? 'video/mp4' :
      extension === 'webm' ? 'video/webm' :
      extension === 'mov' ? 'video/quicktime' :
      extension === 'avi' ? 'video/x-msvideo' :
      // Default
      'application/octet-stream'

    // Return file with proper headers and caching
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
        'Accept-Ranges': 'bytes', // Support video seeking
      },
    })
  } catch (error) {
    console.error('Error proxying media file:', error)
    return NextResponse.json(
      { error: 'Failed to load file' },
      { status: 500 }
    )
  }
}

