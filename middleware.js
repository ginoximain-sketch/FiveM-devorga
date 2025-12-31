import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()
  
  // Forcer la CSP qui autorise WebSocket
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co wss://qmjgzxizjbmqwsltxrmx.supabase.co https://*.netlify.app;"
  )
  
  return response
}

export const config = {
  matcher: '/:path*',
}
