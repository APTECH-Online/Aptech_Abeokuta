'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signInStaff } from './actions'
import FormAlert from '../../../components/shared/FormAlert'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    setLoading(true)
    const result = await signInStaff(email, password)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    const next = searchParams.get('next') || '/admin'
    router.push(next)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-navy-950)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <p className="font-display font-bold text-white text-lg">APTECH Abeokuta</p>
          <p className="text-sm text-white/50 mt-1">Admissions CRM staff sign-in</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 sm:p-8 grid gap-5">
          {error && (
            <FormAlert variant="error" title="Sign-in failed">
              <p>{error}</p>
            </FormAlert>
          )}
          <div>
            <label htmlFor="email" className="field-label">Work email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@aptechabeokuta.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="field-label">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-block disabled:opacity-60">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="field-hint text-center">
            Staff accounts are created by a Super Admin. Contact your administrator for access.
          </p>
        </form>
        <p className="text-center mt-6">
          <Link href="/" className="text-xs text-white/50 hover:text-white/80">← Back to the public website</Link>
        </p>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
