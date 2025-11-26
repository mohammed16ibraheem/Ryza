import { NextRequest, NextResponse } from 'next/server'
import { put, del, list } from '@vercel/blob'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

// Force dynamic rendering - POST route uses cookies for authentication
export const dynamic = 'force-dynamic'

const SHIPPING_SETTINGS_BLOB_PATH = 'data/shipping-settings.json'
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

// Helper function to get shipping settings from Blob storage
async function getShippingSettingsFromBlob(): Promise<{
  freeShippingThreshold: number
  shippingCost: number
}> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return {
        freeShippingThreshold: 5000,
        shippingCost: 200,
      }
    }

    const blobs = await list({
      prefix: SHIPPING_SETTINGS_BLOB_PATH,
      token,
      limit: 1,
    })

    if (blobs.blobs.length === 0) {
      return {
        freeShippingThreshold: 5000,
        shippingCost: 200,
      }
    }

    const blobUrl = blobs.blobs[0].url
    // Add cache-busting query parameter to ensure fresh data
    const cacheBuster = `?t=${Date.now()}`
    const response = await fetch(`${blobUrl}${cacheBuster}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
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
    // Handle legacy data format
    // IMPORTANT: Check for undefined/null, not falsy (0 is valid!)
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
    if (error.status === 404 || error.code === 'ENOENT' || error.message?.includes('not found')) {
      return {
        freeShippingThreshold: 5000,
        shippingCost: 200,
      }
    }
    console.error('Error reading shipping settings from Blob:', error)
    return {
      freeShippingThreshold: 5000,
      shippingCost: 200,
    }
  }
}

// Helper function to save shipping settings to Blob storage
async function saveShippingSettingsToBlob(settings: {
  freeShippingThreshold: number
  shippingCost: number
}): Promise<void> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN not configured')
    }

    const jsonContent = JSON.stringify(settings, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })

    try {
      const existingBlobs = await list({
        prefix: SHIPPING_SETTINGS_BLOB_PATH,
        token,
        limit: 1,
      })

      if (existingBlobs.blobs.length > 0) {
        await del(existingBlobs.blobs[0].url, { token })
      }
    } catch (error) {
      console.warn('Could not delete existing shipping settings blob:', error)
    }

    await put(SHIPPING_SETTINGS_BLOB_PATH, blob, {
      access: 'public',
      token,
      addRandomSuffix: false,
    })
  } catch (error) {
    console.error('Error saving shipping settings to Blob:', error)
    throw error
  }
}

export async function GET() {
  try {
    const settings = await getShippingSettingsFromBlob()
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

    await saveShippingSettingsToBlob(settings)

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
        error: 'Failed to save shipping settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

