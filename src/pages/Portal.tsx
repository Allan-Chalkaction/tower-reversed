import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

// ── Types ────────────────────────────────────────────────────────────

interface Consultation {
  id: string
  scheduled_at: string
  status: string
  notes: string | null
}

interface ClientProfile {
  id: string
  name: string
  email: string
  phone: string | null
}

interface ProfileFormValues {
  name: string
  phone: string
}

interface PasswordFormValues {
  newPassword: string
  confirmPassword: string
}

type View = 'consultations' | 'reports' | 'settings'

// ── Shared UI ────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  scheduled: 'bg-teal/15 text-teal border-teal/30',
  'in progress': 'bg-magenta/15 text-magenta border-magenta/30',
  complete: 'bg-offwhite/10 text-offwhite border-offwhite/20',
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const style = statusStyles[normalized] ?? 'bg-charcoal-light text-offwhite-muted border-charcoal-light'
  const label = normalized === 'in progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <span className={`inline-block px-3 py-1 text-xs font-cinzel tracking-wider border ${style}`}>
      {label}
    </span>
  )
}

const inputClass =
  'w-full bg-charcoal-dark border border-charcoal-light px-4 py-3 font-cormorant text-lg text-offwhite focus:outline-none focus:border-teal transition-colors'

// ── Icons (inline SVGs, 20×20) ───────────────────────────────────────

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10L10 3l7 7" />
      <path d="M5 8.5V16a1 1 0 001 1h3v-4h2v4h3a1 1 0 001-1V8.5" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="14" height="13" rx="1" />
      <line x1="3" y1="8" x2="17" y2="8" />
      <line x1="7" y1="2" x2="7" y2="5" />
      <line x1="13" y1="2" x2="13" y2="5" />
    </svg>
  )
}

function IconReport() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h5l5 5v10a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z" />
      <path d="M11 2v5h5" />
      <line x1="8" y1="11" x2="13" y2="11" />
      <line x1="8" y1="14" x2="11" y2="14" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="3" />
      <path d="M16.5 12.5a1.5 1.5 0 00.3 1.65l.05.05a1.82 1.82 0 01-1.29 3.11 1.82 1.82 0 01-1.29-.54l-.05-.05a1.5 1.5 0 00-1.65-.3 1.5 1.5 0 00-.91 1.37V18a1.82 1.82 0 01-3.64 0v-.09a1.5 1.5 0 00-.98-1.37 1.5 1.5 0 00-1.65.3l-.05.05a1.82 1.82 0 01-2.58-2.58l.05-.05a1.5 1.5 0 00.3-1.65 1.5 1.5 0 00-1.37-.91H2a1.82 1.82 0 010-3.64h.09a1.5 1.5 0 001.37-.98 1.5 1.5 0 00-.3-1.65l-.05-.05A1.82 1.82 0 015.69 2.7l.05.05a1.5 1.5 0 001.65.3h.07a1.5 1.5 0 00.91-1.37V2a1.82 1.82 0 013.64 0v.09a1.5 1.5 0 00.91 1.37 1.5 1.5 0 001.65-.3l.05-.05a1.82 1.82 0 012.58 2.58l-.05.05a1.5 1.5 0 00-.3 1.65v.07a1.5 1.5 0 001.37.91H18a1.82 1.82 0 010 3.64h-.09a1.5 1.5 0 00-1.37.91z" />
    </svg>
  )
}

function IconSignOut() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17H4a1 1 0 01-1-1V4a1 1 0 011-1h3" />
      <polyline points="11,14 17,10 11,6" />
      <line x1="17" y1="10" x2="7" y2="10" />
    </svg>
  )
}

// ── Sidebar ──────────────────────────────────────────────────────────

interface SidebarProps {
  activeView: View
  onNavigate: (view: View) => void
  onSignOut: () => void
}

function Sidebar({ activeView, onNavigate, onSignOut }: SidebarProps) {
  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'consultations', label: 'My Consultations', icon: <IconCalendar /> },
    { id: 'reports', label: 'Reports', icon: <IconReport /> },
    { id: 'settings', label: 'Account Settings', icon: <IconSettings /> },
  ]

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[220px] bg-[#222222] border-r border-charcoal-light flex flex-col z-50">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 px-5 pt-6 pb-8 group">
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="none"
          className="text-offwhite group-hover:text-teal transition-colors shrink-0"
        >
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>
        <span className="font-cinzel text-sm tracking-widest uppercase text-offwhite">
          Tower Reversed
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded font-cinzel text-xs tracking-wider text-offwhite-muted hover:text-offwhite hover:bg-charcoal-light/40 transition-colors"
        >
          <IconHome />
          Home
        </Link>

        {navItems.map((item) => {
          const active = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-cinzel text-xs tracking-wider transition-colors text-left ${
                active
                  ? 'bg-charcoal-light/60 text-teal'
                  : 'text-offwhite-muted hover:text-offwhite hover:bg-charcoal-light/40'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="px-3 pb-6">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded font-cinzel text-xs tracking-wider text-offwhite-muted hover:text-offwhite hover:bg-charcoal-light/40 transition-colors"
        >
          <IconSignOut />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

// ── Consultations View ───────────────────────────────────────────────

function ConsultationsView({ consultations, loading, error }: { consultations: Consultation[]; loading: boolean; error: string | null }) {
  if (loading) {
    return <p className="font-cormorant text-lg text-offwhite-muted">Loading consultations...</p>
  }

  if (error) {
    return (
      <div className="bg-magenta/10 border border-magenta/30 text-magenta px-5 py-4 font-cormorant text-base">
        {error}
      </div>
    )
  }

  if (consultations.length === 0) {
    return (
      <div className="border border-charcoal-light p-10 text-center">
        <p className="font-cormorant text-xl text-offwhite-muted mb-4">
          No consultations yet.
        </p>
        <p className="font-cormorant text-base text-offwhite-muted/60 mb-6">
          Book your first session to get started.
        </p>
        <Link
          to="/#booking"
          className="font-cinzel text-sm tracking-wider px-6 py-3 bg-magenta text-offwhite hover:bg-magenta-dark transition-colors inline-block"
        >
          Book Your First Session
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {consultations.map((c) => (
        <div
          key={c.id}
          className="border border-charcoal-light p-6"
        >
          <div className="flex items-center gap-5">
            <p className="font-cormorant text-lg text-offwhite">
              {new Date(c.scheduled_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <StatusBadge status={c.status} />
          </div>
          {c.notes && (
            <p className="font-cormorant text-base text-offwhite-muted mt-3 leading-relaxed">
              {c.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Reports View ─────────────────────────────────────────────────────

function ReportsView({ consultations, loading, error }: { consultations: Consultation[]; loading: boolean; error: string | null }) {
  if (loading) {
    return <p className="font-cormorant text-lg text-offwhite-muted">Loading reports...</p>
  }

  if (error) {
    return (
      <div className="bg-magenta/10 border border-magenta/30 text-magenta px-5 py-4 font-cormorant text-base">
        {error}
      </div>
    )
  }

  const completed = consultations.filter((c) => c.status.toLowerCase() === 'complete')

  if (completed.length === 0) {
    return (
      <div className="border border-charcoal-light p-10 text-center">
        <p className="font-cormorant text-xl text-offwhite-muted mb-2">
          No reports yet.
        </p>
        <p className="font-cormorant text-base text-offwhite-muted/60">
          Your reports will appear here after your consultation is complete.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {completed.map((c) => (
        <div
          key={c.id}
          className="border border-charcoal-light p-6"
        >
          <div className="flex items-center gap-5">
            <p className="font-cormorant text-lg text-offwhite">
              {new Date(c.scheduled_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <StatusBadge status={c.status} />
          </div>
          {c.notes && (
            <p className="font-cormorant text-base text-offwhite-muted mt-3 leading-relaxed">
              {c.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Account Settings View ────────────────────────────────────────────

function SettingsView({ client, onClientUpdate }: { client: ClientProfile | null; onClientUpdate: (c: ClientProfile) => void }) {
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const profileForm = useForm<ProfileFormValues>({
    values: client ? { name: client.name, phone: client.phone ?? '' } : undefined,
  })

  const passwordForm = useForm<PasswordFormValues>({
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const onProfileSubmit = async (values: ProfileFormValues) => {
    if (!client) return
    setProfileSaved(false)
    setProfileError('')

    const { error } = await supabase
      .from('clients')
      .update({ name: values.name, phone: values.phone || null })
      .eq('id', client.id)

    if (error) {
      setProfileError('Failed to update profile. Please try again.')
    } else {
      onClientUpdate({ ...client, name: values.name, phone: values.phone || null })
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    }
  }

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setPasswordSaved(false)
    setPasswordError('')

    if (values.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }

    if (values.newPassword !== values.confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: values.newPassword })

    if (error) {
      setPasswordError(error.message)
    } else {
      passwordForm.reset()
      setPasswordSaved(true)
      setTimeout(() => setPasswordSaved(false), 3000)
    }
  }

  return (
    <div className="space-y-12">
      {/* Profile */}
      <div>
        <h3 className="font-cinzel text-base text-offwhite mb-6">Profile Information</h3>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="border border-charcoal-light p-6 space-y-5">
          {profileError && (
            <div className="bg-magenta/10 border border-magenta/30 text-magenta px-4 py-3 font-cormorant text-base">
              {profileError}
            </div>
          )}
          {profileSaved && (
            <div className="bg-teal/10 border border-teal/30 text-teal px-4 py-3 font-cormorant text-base">
              Profile updated successfully.
            </div>
          )}

          <div>
            <label className="font-cinzel text-xs tracking-wider text-offwhite-muted block mb-2">
              Name
            </label>
            <input type="text" {...profileForm.register('name', { required: true })} className={inputClass} />
          </div>

          <div>
            <label className="font-cinzel text-xs tracking-wider text-offwhite-muted block mb-2">
              Phone
            </label>
            <input
              type="tel"
              {...profileForm.register('phone')}
              placeholder="Optional"
              className={`${inputClass} placeholder:text-offwhite-muted/50`}
            />
          </div>

          <button
            type="submit"
            disabled={profileForm.formState.isSubmitting}
            className="font-cinzel text-sm tracking-wider px-8 py-3 bg-magenta text-offwhite hover:bg-magenta-dark transition-colors disabled:opacity-50"
          >
            {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div>
        <h3 className="font-cinzel text-base text-offwhite mb-6">Change Password</h3>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="border border-charcoal-light p-6 space-y-5">
          {passwordError && (
            <div className="bg-magenta/10 border border-magenta/30 text-magenta px-4 py-3 font-cormorant text-base">
              {passwordError}
            </div>
          )}
          {passwordSaved && (
            <div className="bg-teal/10 border border-teal/30 text-teal px-4 py-3 font-cormorant text-base">
              Password changed successfully.
            </div>
          )}

          <div>
            <label className="font-cinzel text-xs tracking-wider text-offwhite-muted block mb-2">
              New Password
            </label>
            <input
              type="password"
              {...passwordForm.register('newPassword', { required: true })}
              className={inputClass}
            />
            <p className="font-cormorant text-sm text-offwhite-muted/60 mt-1.5">
              Must be at least 6 characters
            </p>
          </div>

          <div>
            <label className="font-cinzel text-xs tracking-wider text-offwhite-muted block mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              {...passwordForm.register('confirmPassword', { required: true })}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={passwordForm.formState.isSubmitting}
            className="font-cinzel text-sm tracking-wider px-8 py-3 bg-magenta text-offwhite hover:bg-magenta-dark transition-colors disabled:opacity-50"
          >
            {passwordForm.formState.isSubmitting ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── View headers ─────────────────────────────────────────────────────

const viewTitles: Record<View, string> = {
  consultations: 'My Consultations',
  reports: 'Reports',
  settings: 'Account Settings',
}

// ── Main Portal ──────────────────────────────────────────────────────

export default function Portal() {
  const { user, session, signOut } = useAuth()
  const [activeView, setActiveView] = useState<View>('consultations')
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [client, setClient] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!session?.access_token || !session.user?.email) return

      const email = session.user.email

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, name, email, phone')
        .eq('email', email)
        .single()

      console.log('[Portal] clients query result:', { clientData, clientError, email })

      if (clientError) {
        setFetchError(`Could not load your profile: ${clientError.message} (code ${clientError.code})`)
        setLoading(false)
        return
      }

      if (clientData) {
        setClient(clientData)

        const { data, error: consultError } = await supabase
          .from('consultations')
          .select('id, scheduled_at, status, notes')
          .eq('client_id', clientData.id)
          .order('scheduled_at', { ascending: false })

        console.log('[Portal] consultations query result:', { data, consultError })

        if (consultError) {
          setFetchError(`Could not load consultations: ${consultError.message}`)
        } else {
          setConsultations(data ?? [])
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [session])

  return (
    <div className="flex min-h-screen">
      <Sidebar activeView={activeView} onNavigate={setActiveView} onSignOut={signOut} />

      <div className="ml-[220px] flex-1 px-10 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-cinzel text-2xl text-offwhite mb-1">
            {viewTitles[activeView]}
          </h1>
          <p className="font-cormorant text-base text-offwhite-muted">
            {client?.name ?? user?.user_metadata?.full_name} &middot; {user?.email}
          </p>
        </div>

        {/* Content */}
        <div className="max-w-3xl">
          {activeView === 'consultations' && (
            <ConsultationsView consultations={consultations} loading={loading} error={fetchError} />
          )}
          {activeView === 'reports' && (
            <ReportsView consultations={consultations} loading={loading} error={fetchError} />
          )}
          {activeView === 'settings' && (
            <SettingsView client={client} onClientUpdate={setClient} />
          )}
        </div>
      </div>
    </div>
  )
}
