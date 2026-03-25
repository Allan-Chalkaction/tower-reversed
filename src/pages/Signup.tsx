import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordTooShort = passwordTouched && password.length > 0 && password.length < 6

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: upsertError } = await supabase.from('clients').upsert(
        { id: data.user.id, name, email },
        { onConflict: 'id' }
      )

      if (upsertError) {
        console.error('Failed to upsert client record:', upsertError)
      }
    }

    navigate('/intake')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="font-cinzel text-3xl text-offwhite mb-2 text-center">Create Account</h1>
        <p className="font-cormorant text-lg text-offwhite-muted text-center mb-8">
          Begin your journey with Tower Reversed
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-magenta/10 border border-magenta/30 text-magenta px-4 py-3 font-cormorant text-base">
              {error}
            </div>
          )}

          <div>
            <label className="font-cinzel text-xs tracking-wider text-offwhite-muted block mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-charcoal-dark border border-charcoal-light px-4 py-3 font-cormorant text-lg text-offwhite focus:outline-none focus:border-teal transition-colors"
            />
          </div>

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
              onBlur={() => setPasswordTouched(true)}
              className={`w-full bg-charcoal-dark border px-4 py-3 font-cormorant text-lg text-offwhite focus:outline-none transition-colors ${
                passwordTooShort
                  ? 'border-magenta focus:border-magenta'
                  : 'border-charcoal-light focus:border-teal'
              }`}
            />
            <p className={`font-cormorant text-sm mt-1.5 ${passwordTooShort ? 'text-magenta' : 'text-offwhite-muted/60'}`}>
              Must be at least 6 characters
            </p>
          </div>

          <div>
            <label className="font-cinzel text-xs tracking-wider text-offwhite-muted block mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-charcoal-dark border border-charcoal-light px-4 py-3 font-cormorant text-lg text-offwhite focus:outline-none focus:border-teal transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-cinzel text-sm tracking-wider px-8 py-4 bg-magenta text-offwhite hover:bg-magenta-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="font-cormorant text-base text-offwhite-muted text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-teal hover:text-teal-dark transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
