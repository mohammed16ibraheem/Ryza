import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add cache headers for image and video files
  // This ensures static assets are cached properly
  const pathname = request.nextUrl.pathname

  // Check if it's an image or video file
  if (
    pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|mp4|webm|mov)$/i)
  ) {
    // Set aggressive caching for images and videos (1 year)
    // Browser will cache these files and load them instantly on return visits
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    )
  }

  return response
}

export const config = {
  // Only run middleware on image/video file requests
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

