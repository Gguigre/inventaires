'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/shared/data/firebase'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await cred.user.getIdToken()
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      if (!res.ok) {
        setError('Connexion impossible. Veuillez réessayer.')
        return
      }
      router.push('/dashboard/inventaires')
    } catch {
      setError('Email ou mot de passe incorrect.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Connexion</h1>
        <p className="text-sm text-slate-500 mb-8">Accès réservé aux responsables.</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full h-10 rounded-lg border-2 border-slate-200 px-3 text-sm
                         focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full h-10 rounded-lg border-2 border-slate-200 px-3 text-sm
                         focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-10 rounded-lg bg-blue-600 text-white text-sm font-semibold
                       hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
