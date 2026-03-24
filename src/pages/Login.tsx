import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/portal')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="font-cinzel text-3xl text-offwhite mb-2 text-center">Sign In</h1>
        <p className="font-cormorant text-lg text-offwhite-muted text-center mb-8">
          Welcome back to Tower Reversed
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-magenta/10 border border-magenta/30 text-magenta px-4 py-3 font-cormorant text-base">
              {error}
            </div>
          )}

          <div>
            <label className="font-cinzel text-xs tracking-wider text-offwhite-muted block mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-charcoal-dark border border-charcoal-light px-4 py-3 font-cormorant text-lg text-offwhite focus:outline-none focus:border-teal transition-colors"
            />
          </div>

          <div>
            <label className="font-cinzel text-xs tracking-wider text-offwhite-muted block mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-charcoal-dark border border-charcoal-light px-4 py-3 font-cormorant text-lg text-offwhite focus:outline-none focus:border-teal transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-cinzel text-sm tracking-wider px-8 py-4 bg-magenta text-offwhite hover:bg-magenta-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="font-cormorant text-base text-offwhite-muted text-center mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-teal hover:text-teal-dark transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
