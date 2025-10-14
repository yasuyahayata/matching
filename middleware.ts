import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 公開ページ（認証不要）
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/auth/error',
    '/api/auth',
  ]
  
  // 静的ファイルとAPI認証エンドポイントはスキップ
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // 公開ページかチェック
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path)
  )
  
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // JWT トークンを取得
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })
  
  // 認証が必要なページで未認証の場合
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // 管理者専用ページのアクセス制御
  if (pathname.startsWith('/admin')) {
    const userType = token.userType as string
    if (userType !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  // プロジェクト管理ページのアクセス制御
  if (pathname.startsWith('/projects/manage')) {
    const userType = token.userType as string
    if (userType !== 'client' && userType !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  // 認証済みユーザーがログインページにアクセスした場合
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}