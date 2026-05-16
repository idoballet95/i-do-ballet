'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Suspense } from 'react'

function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      const from = searchParams.get('from') || '/'
      router.replace(from)
    } else {
      const data = await res.json()
      setError(data.error || '비밀번호가 틀렸어요')
      setPassword('')
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* 로고 */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
            <Image
              src="/profile.png"
              alt="아이두"
              width={80}
              height={80}
              className="object-cover"
            />
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">아이두의</p>
            <p className="text-xl font-bold text-gray-800">발레 다이어리</p>
          </div>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800 text-center text-lg tracking-widest outline-none focus:border-pink-300 focus:bg-white transition-all"
            autoComplete="current-password"
          />

          {error && (
            <p className="text-center text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || password.length === 0}
            className="w-full py-3.5 rounded-2xl bg-pink-400 text-white font-semibold text-base disabled:opacity-40 active:scale-95 transition-all"
          >
            {loading ? '확인 중...' : '입장하기'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
