// ── SQL Migration (run in Supabase SQL editor before using) ──────────
// ALTER TABLE intake_forms ADD COLUMN IF NOT EXISTS address text;
// ALTER TABLE intake_forms ADD COLUMN IF NOT EXISTS year_built int;
// ALTER TABLE intake_forms ADD COLUMN IF NOT EXISTS renovations jsonb;
// ALTER TABLE intake_forms ADD COLUMN IF NOT EXISTS satellite_url text;
// ALTER TABLE intake_forms DROP COLUMN IF EXISTS front_door_direction;
// ALTER TABLE intake_forms ADD COLUMN IF NOT EXISTS service text DEFAULT 'feng_shui';

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

// ── Types ────────────────────────────────────────────────────────────

type Service = 'feng_shui' | 'human_design' | 'both'

interface Occupant {
  name: string
  relationship: string
  birthDate: string
  birthTime: string
  birthTimeUnknown: boolean
  birthCity: string
  birthState: string
  birthCountry: string
}

interface Renovations {
  hasRenovations: boolean
  description: string
  year: number | null
  roofRemoved: boolean
  roofYear: number | null
}

const RELATIONSHIPS = ['Self', 'Spouse/Partner', 'Child', 'Parent', 'Roommate', 'Other'] as const

const LIFE_CONCERNS = [
  'Wealth & Career',
  'Relationships & Love',
  'Health & Wellbeing',
  'Family Harmony',
  'Creativity & Children',
  'Knowledge & Self-Development',
  'Fame & Reputation',
  'Travel & Helpful People',
] as const

const SERVICE_OPTIONS: { id: Service; title: string; description: string }[] = [
  { id: 'feng_shui', title: 'Feng Shui Consultation', description: 'Full space analysis using classical feng shui frameworks' },
  { id: 'human_design', title: 'Human Design Reading', description: 'A precise look at how you\'re designed to operate' },
  { id: 'both', title: 'Both', description: 'Complete consultation combining feng shui and human design' },
]

// ── Shared styles ────────────────────────────────────────────────────

const inputClass =
  'w-full bg-charcoal-dark border border-charcoal-light px-4 py-3 font-cormorant text-lg text-offwhite focus:outline-none focus:border-teal transition-colors'

const labelClass = 'font-cinzel text-xs tracking-wider text-offwhite-muted block mb-2'

const btnNext = 'font-cinzel text-sm tracking-wider px-8 py-3 bg-magenta text-offwhite hover:bg-magenta-dark transition-colors'
const btnBack = 'font-cinzel text-sm tracking-wider px-8 py-3 border border-charcoal-light text-offwhite-muted hover:border-offwhite hover:text-offwhite transition-colors'

// ── File upload area ─────────────────────────────────────────────────

function FileUpload({
  label,
  hint,
  file,
  previewUrl,
  onSelect,
}: {
  label: string
  hint: string
  file: File | null
  previewUrl: string | null
  onSelect: (file: File | null) => void
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onSelect(e.target.files?.[0] ?? null)
  }

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <p className="font-cormorant text-sm text-offwhite-muted/60 mb-3">{hint}</p>
      <label className="block border border-dashed border-charcoal-light hover:border-offwhite/30 transition-colors cursor-pointer p-8 text-center">
        <input type="file" accept="image/*" onChange={handleChange} className="hidden" />
        {previewUrl ? (
          <div>
            <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto mb-3 opacity-90" />
            <p className="font-cormorant text-sm text-offwhite-muted">{file?.name}</p>
            <p className="font-cormorant text-xs text-offwhite-muted/60 mt-1">Click to replace</p>
          </div>
        ) : (
          <div>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-offwhite-muted/40 mb-3">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="font-cormorant text-base text-offwhite-muted">Click to upload an image</p>
            <p className="font-cormorant text-sm text-offwhite-muted/50 mt-1">PNG, JPG, or WEBP</p>
          </div>
        )}
      </label>
    </div>
  )
}

// ── Progress indicator ───────────────────────────────────────────────

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-12">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const isActive = stepNum === current
        const isComplete = stepNum < current

        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`w-12 h-px ${isComplete ? 'bg-teal' : 'bg-charcoal-light'}`} />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 flex items-center justify-center text-xs font-cinzel border transition-colors ${
                  isActive
                    ? 'border-teal text-teal'
                    : isComplete
                      ? 'border-teal bg-teal/15 text-teal'
                      : 'border-charcoal-light text-offwhite-muted'
                }`}
              >
                {stepNum}
              </div>
              <span
                className={`font-cinzel text-xs tracking-wider hidden sm:inline ${
                  isActive ? 'text-offwhite' : 'text-offwhite-muted'
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────

function emptyOccupant(relationship = 'Self'): Occupant {
  return { name: '', relationship, birthDate: '', birthTime: '', birthTimeUnknown: false, birthCity: '', birthState: '', birthCountry: 'USA' }
}

async function uploadFile(bucket: string, path: string, file: File): Promise<string | null> {
  const { error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

function getStepLabels(service: Service | null): string[] {
  if (service === 'human_design') return ['Occupants']
  return ['Property', 'Occupants', 'Goals & Issues']
}

// Maps the internal step number (starting at 1 after service selection) to the logical step id
type StepId = 'service' | 'property' | 'occupants' | 'goals'

function getStepSequence(service: Service | null): StepId[] {
  if (!service) return ['service']
  if (service === 'human_design') return ['service', 'occupants']
  return ['service', 'property', 'occupants', 'goals']
}

// ── Main component ───────────────────────────────────────────────────

export default function Intake() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0) // 0 = service selection
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [checkingExisting, setCheckingExisting] = useState(true)

  // Service selection
  const [service, setService] = useState<Service | null>(null)

  // Property
  const [address, setAddress] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')
  const [satelliteFile, setSatelliteFile] = useState<File | null>(null)
  const [satellitePreview, setSatellitePreview] = useState<string | null>(null)
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null)
  const [floorPlanPreview, setFloorPlanPreview] = useState<string | null>(null)
  const [renovations, setRenovations] = useState<Renovations>({
    hasRenovations: false,
    description: '',
    year: null,
    roofRemoved: false,
    roofYear: null,
  })

  // Occupants
  const [occupants, setOccupants] = useState<Occupant[]>([emptyOccupant('Self')])

  // Goals & Issues
  const [lifeConcerns, setLifeConcerns] = useState<string[]>([])
  const [problems, setProblems] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')

  // Derived
  const sequence = getStepSequence(service)
  const currentStepId = sequence[step] ?? 'service'
  const totalSteps = sequence.length
  const isLastStep = step === totalSteps - 1
  const stepLabels = getStepLabels(service)
  // Progress indicator step number (1-based, excludes service selection step)
  const progressStep = step // step 0 = service, steps 1+ map to labels

  // Check if intake already exists
  useEffect(() => {
    async function check() {
      if (!session?.user?.id) return
      const { data } = await supabase
        .from('intake_forms')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)
      if (data && data.length > 0) {
        navigate('/portal', { replace: true })
        return
      }
      setCheckingExisting(false)
    }
    check()
  }, [session, navigate])

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      if (satellitePreview) URL.revokeObjectURL(satellitePreview)
      if (floorPlanPreview) URL.revokeObjectURL(floorPlanPreview)
    }
  }, [satellitePreview, floorPlanPreview])

  // ── File handlers ──────────────────────────────────────────────────

  function handleSatelliteSelect(file: File | null) {
    setSatelliteFile(file)
    if (satellitePreview) URL.revokeObjectURL(satellitePreview)
    setSatellitePreview(file ? URL.createObjectURL(file) : null)
  }

  function handleFloorPlanSelect(file: File | null) {
    setFloorPlanFile(file)
    if (floorPlanPreview) URL.revokeObjectURL(floorPlanPreview)
    setFloorPlanPreview(file ? URL.createObjectURL(file) : null)
  }

  // ── Occupant handlers ─────────────────────────────────────────────

  function addOccupant() {
    setOccupants((prev) => [...prev, emptyOccupant('Other')])
  }

  function removeOccupant(index: number) {
    setOccupants((prev) => prev.filter((_, i) => i !== index))
  }

  function updateOccupant(index: number, field: keyof Occupant, value: string | boolean) {
    setOccupants((prev) =>
      prev.map((occ, i) => (i === index ? { ...occ, [field]: value } : occ))
    )
  }

  // ── Concern toggle ────────────────────────────────────────────────

  function toggleConcern(concern: string) {
    setLifeConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    )
  }

  // ── Navigation ────────────────────────────────────────────────────

  function nextStep() { setStep((s) => Math.min(s + 1, totalSteps - 1)) }
  function prevStep() { setStep((s) => Math.max(s - 1, 0)) }

  function selectServiceAndProceed(s: Service) {
    setService(s)
    setStep(1)
  }

  // ── Submit ────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!session?.user || !service) return
    setError('')
    setSubmitting(true)

    try {
      const uid = session.user.id
      let satelliteUrl: string | null = null
      let floorPlanUrl: string | null = null

      const isFengShui = service === 'feng_shui' || service === 'both'

      if (isFengShui && satelliteFile) {
        const ext = satelliteFile.name.split('.').pop()
        satelliteUrl = await uploadFile('intake-files', `${uid}/satellite/${Date.now()}.${ext}`, satelliteFile)
      }

      if (isFengShui && floorPlanFile) {
        const ext = floorPlanFile.name.split('.').pop()
        floorPlanUrl = await uploadFile('intake-files', `${uid}/floor-plan/${Date.now()}.${ext}`, floorPlanFile)
      }

      // Link to consultation if one exists
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('email', session.user.email!)
        .single()

      let consultationId: string | null = null
      if (clientData) {
        const { data: consult } = await supabase
          .from('consultations')
          .select('id')
          .eq('client_id', clientData.id)
          .order('scheduled_at', { ascending: false })
          .limit(1)
        if (consult && consult.length > 0) {
          consultationId = consult[0].id
        }
      }

      const validOccupants = occupants.filter((o) => o.name.trim())

      const { error: insertError } = await supabase.from('intake_forms').insert({
        user_id: uid,
        service,
        consultation_id: consultationId,
        address: isFengShui ? (address || null) : null,
        year_built: isFengShui && yearBuilt ? Number(yearBuilt) : null,
        satellite_url: satelliteUrl,
        floor_plan_url: floorPlanUrl,
        renovations: isFengShui ? renovations : null,
        occupants: validOccupants,
        life_concerns: isFengShui ? lifeConcerns : null,
        problems: isFengShui ? (problems || null) : null,
        additional_info: isFengShui ? (additionalInfo || null) : null,
      })

      if (insertError) {
        setError(`Failed to save intake: ${insertError.message}`)
        setSubmitting(false)
        return
      }

      navigate('/portal', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(msg)
      setSubmitting(false)
    }
  }

  if (checkingExisting) return null

  // ── Occupant card (shared between feng shui and human design) ─────

  const showRelationship = service !== 'human_design'

  const occupantCards = (
    <div>
      <label className={labelClass}>
        {service === 'human_design' ? 'Who is this reading for?' : 'Occupants'}
      </label>
      <p className="font-cormorant text-sm text-offwhite-muted/60 mb-4">
        {service === 'human_design'
          ? 'Add yourself and anyone else you would like a reading for.'
          : 'Add everyone who lives in the space. The first occupant should be the primary resident.'}
      </p>

      <div className="space-y-4">
        {occupants.map((occ, i) => (
          <div key={i} className="border border-charcoal-light p-5 space-y-4 relative">
            {occupants.length > 1 && (
              <button
                onClick={() => removeOccupant(i)}
                className="absolute top-4 right-4 text-offwhite-muted hover:text-magenta transition-colors"
                title="Remove occupant"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="4" y1="4" x2="12" y2="12" />
                  <line x1="12" y1="4" x2="4" y2="12" />
                </svg>
              </button>
            )}

            <div className={showRelationship ? 'grid grid-cols-2 gap-4' : ''}>
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={occ.name}
                  onChange={(e) => updateOccupant(i, 'name', e.target.value)}
                  className={inputClass}
                />
              </div>
              {showRelationship && (
                <div>
                  <label className={labelClass}>Relationship</label>
                  <select
                    value={occ.relationship}
                    onChange={(e) => updateOccupant(i, 'relationship', e.target.value)}
                    className={`${inputClass} appearance-none`}
                  >
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Birth Date</label>
                <input
                  type="date"
                  value={occ.birthDate}
                  onChange={(e) => updateOccupant(i, 'birthDate', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Birth Time</label>
                <input
                  type="time"
                  value={occ.birthTime}
                  onChange={(e) => updateOccupant(i, 'birthTime', e.target.value)}
                  disabled={occ.birthTimeUnknown}
                  className={`${inputClass} ${occ.birthTimeUnknown ? 'opacity-40' : ''}`}
                />
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={occ.birthTimeUnknown}
                    onChange={(e) => updateOccupant(i, 'birthTimeUnknown', e.target.checked)}
                    className="accent-teal"
                  />
                  <span className="font-cormorant text-sm text-offwhite-muted">Time unknown</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Birth City</label>
                <input
                  type="text"
                  value={occ.birthCity}
                  onChange={(e) => updateOccupant(i, 'birthCity', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Birth State / Province</label>
                <input
                  type="text"
                  value={occ.birthState}
                  onChange={(e) => updateOccupant(i, 'birthState', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Birth Country</label>
                <input
                  type="text"
                  value={occ.birthCountry}
                  onChange={(e) => updateOccupant(i, 'birthCountry', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addOccupant}
        className="mt-4 font-cinzel text-xs tracking-wider text-teal hover:text-teal-dark transition-colors"
      >
        + Add {service === 'human_design' ? 'Person' : 'Occupant'}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <h1 className="font-cinzel text-3xl text-offwhite mb-2 text-center">Intake Form</h1>
        <p className="font-cormorant text-lg text-offwhite-muted text-center mb-8">
          Help us understand your space and intentions
        </p>

        {/* Show progress indicator only after service is selected */}
        {step > 0 && (
          <StepIndicator current={progressStep} steps={stepLabels} />
        )}

        {error && (
          <div className="bg-magenta/10 border border-magenta/30 text-magenta px-4 py-3 font-cormorant text-base mb-6">
            {error}
          </div>
        )}

        {/* ── Step 0 — Choose Your Service ───────────────────────────── */}
        {currentStepId === 'service' && (
          <div className="space-y-6">
            <label className={labelClass}>Choose Your Service</label>
            <div className="space-y-3">
              {SERVICE_OPTIONS.map((opt) => {
                const selected = service === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setService(opt.id)}
                    className={`w-full text-left p-5 border transition-colors ${
                      selected
                        ? 'border-teal bg-teal/5'
                        : 'border-charcoal-light hover:border-offwhite/30'
                    }`}
                  >
                    <p className={`font-cinzel text-base tracking-wider ${selected ? 'text-teal' : 'text-offwhite'}`}>
                      {opt.title}
                    </p>
                    <p className="font-cormorant text-base text-offwhite-muted mt-1">
                      {opt.description}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => service && selectServiceAndProceed(service)}
                disabled={!service}
                className={`${btnNext} disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Property (feng_shui / both only) ───────────────────────── */}
        {currentStepId === 'property' && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Property Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State ZIP"
                className={`${inputClass} placeholder:text-offwhite-muted/50`}
              />
            </div>

            <div>
              <label className={labelClass}>Year of Construction</label>
              <input
                type="number"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value)}
                placeholder="e.g. 1985"
                maxLength={4}
                className={`${inputClass} placeholder:text-offwhite-muted/50 w-40`}
              />
            </div>

            <FileUpload
              label="Satellite View"
              hint="Upload a satellite/aerial image of the property (optional)"
              file={satelliteFile}
              previewUrl={satellitePreview}
              onSelect={handleSatelliteSelect}
            />

            <FileUpload
              label="Floor Plan"
              hint="Upload an image of your floor plan (optional)"
              file={floorPlanFile}
              previewUrl={floorPlanPreview}
              onSelect={handleFloorPlanSelect}
            />

            {/* Renovations */}
            <div className="border border-charcoal-light p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className={`${labelClass} mb-0`}>Have there been any major renovations?</label>
                <button
                  type="button"
                  onClick={() => setRenovations((r) => ({ ...r, hasRenovations: !r.hasRenovations }))}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    renovations.hasRenovations ? 'bg-teal' : 'bg-charcoal-light'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-offwhite transition-transform ${
                      renovations.hasRenovations ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {renovations.hasRenovations && (
                <>
                  <div>
                    <label className={labelClass}>Describe the renovations</label>
                    <textarea
                      value={renovations.description}
                      onChange={(e) => setRenovations((r) => ({ ...r, description: e.target.value }))}
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Year of renovation</label>
                    <input
                      type="number"
                      value={renovations.year ?? ''}
                      onChange={(e) => setRenovations((r) => ({ ...r, year: e.target.value ? Number(e.target.value) : null }))}
                      placeholder="e.g. 2010"
                      className={`${inputClass} placeholder:text-offwhite-muted/50 w-40`}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <label className={`${labelClass} mb-0`}>Was the roof fully removed or replaced?</label>
                <button
                  type="button"
                  onClick={() => setRenovations((r) => ({ ...r, roofRemoved: !r.roofRemoved }))}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    renovations.roofRemoved ? 'bg-teal' : 'bg-charcoal-light'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-offwhite transition-transform ${
                      renovations.roofRemoved ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {renovations.roofRemoved && (
                <div>
                  <label className={labelClass}>Year roof was removed/replaced</label>
                  <input
                    type="number"
                    value={renovations.roofYear ?? ''}
                    onChange={(e) => setRenovations((r) => ({ ...r, roofYear: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="e.g. 2018"
                    className={`${inputClass} placeholder:text-offwhite-muted/50 w-40`}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className={btnBack}>Back</button>
              <button onClick={nextStep} className={btnNext}>Next</button>
            </div>
          </div>
        )}

        {/* ── Occupants ──────────────────────────────────────────────── */}
        {currentStepId === 'occupants' && (
          <div className="space-y-6">
            {occupantCards}

            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className={btnBack}>Back</button>
              {isLastStep ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`${btnNext} disabled:opacity-50`}
                >
                  {submitting ? 'Submitting...' : 'Complete Intake'}
                </button>
              ) : (
                <button onClick={nextStep} className={btnNext}>Next</button>
              )}
            </div>
          </div>
        )}

        {/* ── Goals & Issues (feng_shui / both only) ─────────────────── */}
        {currentStepId === 'goals' && (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Life Concerns</label>
              <p className="font-cormorant text-sm text-offwhite-muted/60 mb-3">
                Select all that apply
              </p>
              <div className="grid grid-cols-2 gap-2">
                {LIFE_CONCERNS.map((concern) => {
                  const selected = lifeConcerns.includes(concern)
                  return (
                    <button
                      key={concern}
                      type="button"
                      onClick={() => toggleConcern(concern)}
                      className={`text-left px-4 py-3 border font-cormorant text-base transition-colors ${
                        selected
                          ? 'border-teal bg-teal/10 text-teal'
                          : 'border-charcoal-light text-offwhite-muted hover:border-offwhite/30 hover:text-offwhite'
                      }`}
                    >
                      {concern}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>Current Issues / Challenges</label>
              <textarea
                value={problems}
                onChange={(e) => setProblems(e.target.value)}
                rows={4}
                placeholder="Describe any ongoing problems, stressors, or challenges you are experiencing"
                className={`${inputClass} resize-none placeholder:text-offwhite-muted/50`}
              />
            </div>

            <div>
              <label className={labelClass}>Additional Information</label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={3}
                placeholder="Anything else you would like your consultant to know"
                className={`${inputClass} resize-none placeholder:text-offwhite-muted/50`}
              />
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className={btnBack}>Back</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`${btnNext} disabled:opacity-50`}
              >
                {submitting ? 'Submitting...' : 'Complete Intake'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
