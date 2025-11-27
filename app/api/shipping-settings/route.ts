import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

// Force dynamic rendering - POST route uses cookies for authentication
export const dynamic = 'force-dynamic'

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'your-secret-key-change-this-in-production'
)

// Helper function to verify admin authentication
async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_session')?.value

    if (!token) {
      return false
    }

    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload.authenticated === true
  } catch {
    return false
  }
}

import { uploadToGitHub } from '@/lib/github-storage'

const SHIPPING_SETTINGS_FILE_PATH = 'public/data/shipping-settings.json'

// Helper function to get shipping settings from GitHub
async function getShippingSettingsFromStorage(): Promise<{
  freeShippingThreshold: number
  shippingCost: number
}> {
  try {
    const config = {
      token: process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      branch: process.env.GITHUB_BRANCH || 'main',
    }

    if (!config.token || !config.owner || !config.repo) {
      return {
        freeShippingThreshold: 5000,
        shippingCost: 200,
      }
    }

    // For public repos, use raw.githubusercontent.com (faster)
    const rawUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${SHIPPING_SETTINGS_FILE_PATH}`
    const response = await fetch(rawUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return {
          freeShippingThreshold: 5000,
          shippingCost: 200,
        }
      }
      // Fallback to API for private repos
      try {
        const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${SHIPPING_SETTINGS_FILE_PATH}?ref=${config.branch}`
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
            const data = JSON.parse(text)
            const threshold = data.freeShippingThreshold !== undefined && data.freeShippingThreshold !== null
              ? Number(data.freeShippingThreshold)
              : 5000
            const shippingCost = data.shippingCost !== undefined && data.shippingCost !== null
              ? Number(data.shippingCost)
              : 200
            return {
              freeShippingThreshold: threshold,
              shippingCost: shippingCost,
            }
          }
        }
      } catch {}
      return {
        freeShippingThreshold: 5000,
        shippingCost: 200,
      }
    }

    const text = await response.text()
    if (!text || text.trim() === '') {
      return {
        freeShippingThreshold: 5000,
        shippingCost: 200,
      }
    }

    const data = JSON.parse(text)
    const threshold = data.freeShippingThreshold !== undefined && data.freeShippingThreshold !== null
      ? Number(data.freeShippingThreshold)
      : 5000
    const shippingCost = data.shippingCost !== undefined && data.shippingCost !== null
      ? Number(data.shippingCost)
      : 200
    return {
      freeShippingThreshold: threshold,
      shippingCost: shippingCost,
    }
  } catch (error: any) {
    console.error('Error reading shipping settings from GitHub:', error)
    return {
      freeShippingThreshold: 5000,
      shippingCost: 200,
    }
  }
}

// Helper function to save shipping settings to GitHub
async function saveShippingSettingsToStorage(settings: {
  freeShippingThreshold: number
  shippingCost: number
}): Promise<void> {
  const config = {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_REPO_OWNER,
    repo: process.env.GITHUB_REPO_NAME,
    branch: process.env.GITHUB_BRANCH || 'main',
  }

  if (!config.token || !config.owner || !config.repo) {
    throw new Error('GitHub storage not configured')
  }

  const jsonContent = JSON.stringify(settings, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  
  await uploadToGitHub(
    blob,
    SHIPPING_SETTINGS_FILE_PATH,
    `Update shipping settings - ${new Date().toISOString()}`
  )
}

export async function GET() {
  try {
    const settings = await getShippingSettingsFromStorage()
    // Add cache headers to prevent caching of API response
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Error fetching shipping settings:', error)
    return NextResponse.json(
      {
        freeShippingThreshold: 5000,
        shippingCost: 200,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { freeShippingThreshold, shippingCost } = body

    // Validate input
    if (
      typeof freeShippingThreshold !== 'number' ||
      freeShippingThreshold < 0 ||
      typeof shippingCost !== 'number' ||
      shippingCost < 0
    ) {
      return NextResponse.json(
        { error: 'Invalid shipping settings data' },
        { status: 400 }
      )
    }

    const settings = {
      freeShippingThreshold: Math.round(freeShippingThreshold * 100) / 100,
      shippingCost: Math.round(shippingCost * 100) / 100,
    }

    await saveShippingSettingsToStorage(settings)

    // Return saved settings with no-cache headers
    return NextResponse.json(
      { success: true, settings },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('Error saving shipping settings:', error)
    return NextResponse.json(
      {
        error: 'Failed to save shipping settings - storage service not configured',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}

