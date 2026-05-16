import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const correctPassword = process.env.SITE_PASSWORD

  if (!correctPassword) {
    return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 })
  }

  if (password !== correctPassword) {
    return NextResponse.json({ error: '비밀번호가 틀렸어요' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('idoballet_auth', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30일
    path: '/',
  })

  return response
}
