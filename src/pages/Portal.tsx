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

interface IntakeOccupant {
  name: string
  relationship: string
  birthDate: string
  birthTime: string
  birthTimeUnknown: boolean
  birthCity: string
  birthState: string
  birthCountry: string
}

interface IntakeRenovations {
  hasRenovations: boolean
  description: string
  year: number | null
  roofRemoved: boolean
  roofYear: number | null
}

interface IntakeData {
  id: string
  address: string | null
  year_built: number | null
  satellite_url: string | null
  floor_plan_url: string | null
  renovations: IntakeRenovations | null
  occupants: IntakeOccupant[] | null
  life_concerns: string[] | null
  problems: string | null
  additional_info: string | null
  created_at: string
}

type View = 'consultations' | 'booking' | 'reports' | 'intake' | 'settings'

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

function IconIntake() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a1 1 0 00-1 1v14a1 1 0 001 1h8a1 1 0 001-1V3a1 1 0 00-1-1z" />
      <line x1="8" y1="6" x2="12" y2="6" />
      <line x1="8" y1="9" x2="12" y2="9" />
      <line x1="8" y1="12" x2="10" y2="12" />
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
  intakeComplete: boolean
  onNavigate: (view: View) => void
  onSignOut: () => void
}

function Sidebar({ activeView, intakeComplete, onNavigate, onSignOut }: SidebarProps) {
  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'consultations', label: 'My Consultations', icon: <IconCalendar /> },
    ...(intakeComplete ? [{ id: 'booking' as View, label: 'Book a Consultation', icon: <IconCalendar /> }] : []),
    { id: 'intake', label: 'Intake', icon: <IconIntake /> },
    { id: 'reports', label: 'Reports', icon: <IconReport /> },
    { id: 'settings', label: 'Account Settings', icon: <IconSettings /> },
  ]

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[220px] bg-[#222222] border-r border-charcoal-light flex flex-col z-50">
      {/* Logo */}
      <Link to="/" className="px-5 pt-6 pb-8">
        <img src="/logo.jpg" alt="Tower Reversed" style={{ height: 36, width: 'auto' }} />
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
          const showBadge = item.id === 'intake' && !intakeComplete
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
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="text-[10px] tracking-wider bg-magenta/20 text-magenta border border-magenta/30 px-1.5 py-0.5 leading-none">
                  Required
                </span>
              )}
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

function ConsultationsView({ consultations, loading, error, onBook, intakeComplete }: { consultations: Consultation[]; loading: boolean; error: string | null; onBook: () => void; intakeComplete: boolean }) {
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
          {intakeComplete ? 'Book your first session to get started.' : 'Complete your intake form to get started.'}
        </p>
        {intakeComplete ? (
          <button
            onClick={onBook}
            className="font-cinzel text-sm tracking-wider px-6 py-3 bg-magenta text-offwhite hover:bg-magenta-dark transition-colors inline-block"
          >
            Book Your First Session
          </button>
        ) : (
          <Link
            to="/intake"
            className="font-cinzel text-sm tracking-wider px-6 py-3 bg-magenta text-offwhite hover:bg-magenta-dark transition-colors inline-block"
          >
            Complete Intake
          </Link>
        )}
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

// ── Booking View ────────────────────────────────────────────────────

function BookingView() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    if (!win.Cal) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(function (C: any, A: string, L: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = function (a: any, ar: any) { a.q.push(ar) }
        const d = C.document
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        C.Cal = C.Cal || function (...args: any[]) {
          const cal = C.Cal
          if (!cal.loaded) {
            cal.ns = {}
            cal.q = cal.q || []
            const s = d.createElement('script')
            s.src = A
            d.head.appendChild(s)
            cal.loaded = true
          }
          if (args[0] === L) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const api: any = function (...a: any[]) { p(api, a) }
            const namespace = args[1]
            api.q = api.q || []
            if (typeof namespace === 'string') {
              cal.ns[namespace] = cal.ns[namespace] || api
              p(cal.ns[namespace], args)
              p(cal, ['initNamespace', namespace])
            } else p(cal, args)
            return
          }
          p(cal, args)
        }
      })(window, 'https://app.cal.com/embed/embed.js', 'init')
    }

    const Cal = win.Cal
    const ns = 'portal-booking'

    if (!Cal.ns?.[ns]) {
      Cal('init', ns, { origin: 'https://app.cal.com' })
    }

    Cal.ns[ns]('inline', {
      elementOrSelector: '#cal-embed-portal',
      config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true' },
      calLink: 'almittelstaedt/feng-shui-consultation',
    })
    Cal.ns[ns]('ui', {
      hideEventTypeDetails: false,
      layout: 'month_view',
    })
  }, [])

  return (
    <div>
      <p className="font-cormorant text-lg text-offwhite-muted mb-6">
        Select a date and time for your feng shui consultation.
      </p>
      <div className="bg-charcoal-dark">
        <div
          id="cal-embed-portal"
          style={{ width: '100%', height: '900px', overflow: 'hidden' }}
        />
      </div>
    </div>
  )
}

// ── Intake View ─────────────────────────────────────────────────────

function IntakeView({ intake, loading }: { intake: IntakeData | null; loading: boolean }) {
  if (loading) {
    return <p className="font-cormorant text-lg text-offwhite-muted">Loading...</p>
  }

  if (!intake) {
    return (
      <div className="border border-charcoal-light p-10 text-center">
        <p className="font-cormorant text-xl text-offwhite-muted mb-4">
          No intake form submitted yet.
        </p>
        <p className="font-cormorant text-base text-offwhite-muted/60 mb-6">
          Complete your intake to help us prepare for your consultation.
        </p>
        <a
          href="/intake"
          className="font-cinzel text-sm tracking-wider px-6 py-3 bg-magenta text-offwhite hover:bg-magenta-dark transition-colors inline-block"
        >
          Complete Intake
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Property */}
      <div className="border border-charcoal-light p-6 space-y-4">
        <h3 className="font-cinzel text-base text-offwhite mb-2">Property</h3>
        <div className="grid grid-cols-2 gap-4">
          {intake.address && (
            <div className="col-span-2">
              <p className="font-cinzel text-xs tracking-wider text-offwhite-muted mb-1">Address</p>
              <p className="font-cormorant text-lg text-offwhite">{intake.address}</p>
            </div>
          )}
          {intake.year_built && (
            <div>
              <p className="font-cinzel text-xs tracking-wider text-offwhite-muted mb-1">Year Built</p>
              <p className="font-cormorant text-lg text-offwhite">{intake.year_built}</p>
            </div>
          )}
        </div>
        {intake.renovations?.hasRenovations && (
          <div>
            <p className="font-cinzel text-xs tracking-wider text-offwhite-muted mb-1">Renovations</p>
            <p className="font-cormorant text-base text-offwhite-muted leading-relaxed">
              {intake.renovations.description}
              {intake.renovations.year && ` (${intake.renovations.year})`}
            </p>
          </div>
        )}
        {intake.renovations?.roofRemoved && (
          <div>
            <p className="font-cinzel text-xs tracking-wider text-offwhite-muted mb-1">Roof Removed/Replaced</p>
            <p className="font-cormorant text-base text-offwhite-muted">
              Yes{intake.renovations.roofYear && ` (${intake.renovations.roofYear})`}
            </p>
          </div>
        )}
      </div>

      {/* Uploads */}
      {(intake.satellite_url || intake.floor_plan_url) && (
        <div className="border border-charcoal-light p-6 space-y-4">
          {intake.satellite_url && (
            <div>
              <h3 className="font-cinzel text-base text-offwhite mb-3">Satellite View</h3>
              <img src={intake.satellite_url} alt="Satellite view" className="max-h-64 opacity-90" />
            </div>
          )}
          {intake.floor_plan_url && (
            <div>
              <h3 className="font-cinzel text-base text-offwhite mb-3">Floor Plan</h3>
              <img src={intake.floor_plan_url} alt="Floor plan" className="max-h-64 opacity-90" />
            </div>
          )}
        </div>
      )}

      {/* Occupants */}
      {intake.occupants && intake.occupants.length > 0 && (
        <div className="border border-charcoal-light p-6">
          <h3 className="font-cinzel text-base text-offwhite mb-4">Occupants</h3>
          <div className="space-y-3">
            {intake.occupants.map((occ, i) => (
              <div key={i} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <p className="font-cormorant text-lg text-offwhite">{occ.name}</p>
                <p className="font-cormorant text-sm text-offwhite-muted">{occ.relationship}</p>
                {occ.birthDate && (
                  <p className="font-cormorant text-sm text-offwhite-muted">
                    Born {occ.birthDate}{occ.birthTime && !occ.birthTimeUnknown ? ` at ${occ.birthTime}` : ''}
                  </p>
                )}
                {(occ.birthCity || occ.birthState || occ.birthCountry) && (
                  <p className="font-cormorant text-sm text-offwhite-muted">
                    {[occ.birthCity, occ.birthState, occ.birthCountry].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Life Concerns */}
      {intake.life_concerns && intake.life_concerns.length > 0 && (
        <div className="border border-charcoal-light p-6">
          <h3 className="font-cinzel text-base text-offwhite mb-4">Life Concerns</h3>
          <div className="flex flex-wrap gap-2">
            {intake.life_concerns.map((concern) => (
              <span
                key={concern}
                className="inline-block px-3 py-1 text-xs font-cinzel tracking-wider border border-teal/30 bg-teal/10 text-teal"
              >
                {concern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Goals & Issues */}
      {(intake.problems || intake.additional_info) && (
        <div className="border border-charcoal-light p-6 space-y-4">
          <h3 className="font-cinzel text-base text-offwhite mb-2">Goals & Issues</h3>
          {intake.problems && (
            <div>
              <p className="font-cinzel text-xs tracking-wider text-offwhite-muted mb-1">Current Challenges</p>
              <p className="font-cormorant text-base text-offwhite-muted leading-relaxed">{intake.problems}</p>
            </div>
          )}
          {intake.additional_info && (
            <div>
              <p className="font-cinzel text-xs tracking-wider text-offwhite-muted mb-1">Additional Information</p>
              <p className="font-cormorant text-base text-offwhite-muted leading-relaxed">{intake.additional_info}</p>
            </div>
          )}
        </div>
      )}

      <p className="font-cormorant text-sm text-offwhite-muted/50">
        Submitted {new Date(intake.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
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
  booking: 'Book a Consultation',
  intake: 'Intake',
  reports: 'Reports',
  settings: 'Account Settings',
}

// ── Main Portal ──────────────────────────────────────────────────────

export default function Portal() {
  const { user, session, signOut } = useAuth()
  const [activeView, setActiveView] = useState<View>('consultations')
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [client, setClient] = useState<ClientProfile | null>(null)
  const [intake, setIntake] = useState<IntakeData | null>(null)
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

      // Fetch intake form
      const { data: intakeData } = await supabase
        .from('intake_forms')
        .select('id, address, year_built, satellite_url, floor_plan_url, renovations, occupants, life_concerns, problems, additional_info, created_at')
        .eq('user_id', session.user.id)
        .limit(1)
        .single()

      if (intakeData) {
        setIntake(intakeData)
      }

      setLoading(false)
    }

    fetchData()
  }, [session])

  return (
    <div className="flex min-h-screen">
      <Sidebar activeView={activeView} intakeComplete={!!intake} onNavigate={setActiveView} onSignOut={signOut} />

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

        {/* Intake required banner */}
        {!loading && !intake && (
          <div className="bg-magenta/10 border border-magenta/30 px-5 py-4 mb-8 flex items-center justify-between gap-4 max-w-3xl">
            <p className="font-cormorant text-base text-magenta">
              Complete your intake form before booking a consultation.
            </p>
            <Link
              to="/intake"
              className="font-cinzel text-xs tracking-wider px-5 py-2 bg-magenta text-offwhite hover:bg-magenta-dark transition-colors whitespace-nowrap shrink-0"
            >
              Complete Intake
            </Link>
          </div>
        )}

        {/* Content */}
        <div className="max-w-3xl">
          {activeView === 'consultations' && (
            <ConsultationsView consultations={consultations} loading={loading} error={fetchError} onBook={() => setActiveView('booking')} intakeComplete={!!intake} />
          )}
          {activeView === 'booking' && (
            <BookingView />
          )}
          {activeView === 'intake' && (
            <IntakeView intake={intake} loading={loading} />
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
