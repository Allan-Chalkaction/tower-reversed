import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

// ── Types ────────────────────────────────────────────────────────────

interface Occupant {
  name: string
  birthYear: string
}

const SPACE_TYPES = ['Home', 'Apartment', 'Condo', 'Office'] as const

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

// ── Shared styles ────────────────────────────────────────────────────

const inputClass =
  'w-full bg-charcoal-dark border border-charcoal-light px-4 py-3 font-cormorant text-lg text-offwhite focus:outline-none focus:border-teal transition-colors'

const labelClass = 'font-cinzel text-xs tracking-wider text-offwhite-muted block mb-2'

// ── Progress indicator ───────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Your Space', 'Occupants & Intentions', 'Floor Plan']

  return (
    <div className="flex items-center justify-center gap-2 mb-12">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const isActive = stepNum === current
        const isComplete = stepNum < current

        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`w-12 h-px ${isComplete ? 'bg-teal' : 'bg-charcoal-light'}`}
              />
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

// ── Main component ───────────────────────────────────────────────────

export default function Intake() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [checkingExisting, setCheckingExisting] = useState(true)

  // Step 1
  const [spaceType, setSpaceType] = useState('')
  const [squareFootage, setSquareFootage] = useState('')
  const [problems, setProblems] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')

  // Step 2
  const [occupants, setOccupants] = useState<Occupant[]>([{ name: '', birthYear: '' }])
  const [lifeConcerns, setLifeConcerns] = useState<string[]>([])

  // Step 3
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function toggleConcern(concern: string) {
    setLifeConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    )
  }

  function addOccupant() {
    setOccupants((prev) => [...prev, { name: '', birthYear: '' }])
  }

  function removeOccupant(index: number) {
    setOccupants((prev) => prev.filter((_, i) => i !== index))
  }

  function updateOccupant(index: number, field: keyof Occupant, value: string) {
    setOccupants((prev) =>
      prev.map((occ, i) => (i === index ? { ...occ, [field]: value } : occ))
    )
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFloorPlanFile(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  function nextStep() {
    setStep((s) => Math.min(s + 1, 3))
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleSubmit() {
    if (!session?.user) return
    setError('')
    setSubmitting(true)

    try {
      let floorPlanUrl: string | null = null

      // Upload floor plan if provided
      if (floorPlanFile) {
        const ext = floorPlanFile.name.split('.').pop()
        const path = `${session.user.id}/floor-plan/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('intake-files')
          .upload(path, floorPlanFile)

        if (uploadError) {
          setError(`Upload failed: ${uploadError.message}`)
          setSubmitting(false)
          return
        }

        const { data: publicUrlData } = supabase.storage
          .from('intake-files')
          .getPublicUrl(path)

        floorPlanUrl = publicUrlData.publicUrl
      }

      // Find client record for consultation linking
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

      // Filter out empty occupants
      const validOccupants = occupants.filter((o) => o.name.trim())

      const { error: insertError } = await supabase.from('intake_forms').insert({
        user_id: session.user.id,
        consultation_id: consultationId,
        space_type: spaceType || null,
        square_footage: squareFootage ? Number(squareFootage) : null,
        problems: problems || null,
        additional_info: additionalInfo || null,
        occupants: validOccupants,
        life_concerns: lifeConcerns,
        floor_plan_url: floorPlanUrl,
      })

      if (insertError) {
        setError(`Failed to save intake: ${insertError.message}`)
        setSubmitting(false)
        return
      }

      navigate('/portal', { replace: true })
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setSubmitting(false)
    }
  }

  if (checkingExisting) return null

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <h1 className="font-cinzel text-3xl text-offwhite mb-2 text-center">Intake Form</h1>
        <p className="font-cormorant text-lg text-offwhite-muted text-center mb-8">
          Help us understand your space and intentions
        </p>

        <StepIndicator current={step} />

        {error && (
          <div className="bg-magenta/10 border border-magenta/30 text-magenta px-4 py-3 font-cormorant text-base mb-6">
            {error}
          </div>
        )}

        {/* Step 1 — Your Space */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Space Type</label>
              <select
                value={spaceType}
                onChange={(e) => setSpaceType(e.target.value)}
                className={`${inputClass} appearance-none`}
              >
                <option value="">Select...</option>
                {SPACE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Square Footage</label>
              <input
                type="number"
                value={squareFootage}
                onChange={(e) => setSquareFootage(e.target.value)}
                placeholder="e.g. 1200"
                className={`${inputClass} placeholder:text-offwhite-muted/50`}
              />
            </div>

            <div>
              <label className={labelClass}>What issues are you currently experiencing?</label>
              <textarea
                value={problems}
                onChange={(e) => setProblems(e.target.value)}
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>Anything else you'd like us to know?</label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={nextStep}
                className="font-cinzel text-sm tracking-wider px-8 py-3 bg-magenta text-offwhite hover:bg-magenta-dark transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Occupants & Intentions */}
        {step === 2 && (
          <div className="space-y-8">
            {/* Occupants */}
            <div>
              <label className={labelClass}>Occupants</label>
              <div className="space-y-3">
                {occupants.map((occ, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <input
                      type="text"
                      value={occ.name}
                      onChange={(e) => updateOccupant(i, 'name', e.target.value)}
                      placeholder="Name"
                      className={`${inputClass} flex-1 placeholder:text-offwhite-muted/50`}
                    />
                    <input
                      type="number"
                      value={occ.birthYear}
                      onChange={(e) => updateOccupant(i, 'birthYear', e.target.value)}
                      placeholder="Birth year"
                      className={`${inputClass} w-32 placeholder:text-offwhite-muted/50`}
                    />
                    {occupants.length > 1 && (
                      <button
                        onClick={() => removeOccupant(i)}
                        className="mt-3 text-offwhite-muted hover:text-magenta transition-colors"
                        title="Remove occupant"
                      >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <line x1="4" y1="9" x2="14" y2="9" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addOccupant}
                className="mt-3 font-cinzel text-xs tracking-wider text-teal hover:text-teal-dark transition-colors"
              >
                + Add Occupant
              </button>
            </div>

            {/* Life Concerns */}
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

            <div className="flex justify-between pt-4">
              <button
                onClick={prevStep}
                className="font-cinzel text-sm tracking-wider px-8 py-3 border border-charcoal-light text-offwhite-muted hover:border-offwhite hover:text-offwhite transition-colors"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="font-cinzel text-sm tracking-wider px-8 py-3 bg-magenta text-offwhite hover:bg-magenta-dark transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Floor Plan */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Floor Plan Upload</label>
              <p className="font-cormorant text-sm text-offwhite-muted/60 mb-3">
                Upload an image of your floor plan (optional)
              </p>

              <label className="block border border-dashed border-charcoal-light hover:border-offwhite/30 transition-colors cursor-pointer p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {previewUrl ? (
                  <div>
                    <img
                      src={previewUrl}
                      alt="Floor plan preview"
                      className="max-h-64 mx-auto mb-3 opacity-90"
                    />
                    <p className="font-cormorant text-sm text-offwhite-muted">
                      {floorPlanFile?.name}
                    </p>
                    <p className="font-cormorant text-xs text-offwhite-muted/60 mt-1">
                      Click to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mx-auto text-offwhite-muted/40 mb-3"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17,8 12,3 7,8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p className="font-cormorant text-base text-offwhite-muted">
                      Click to upload an image
                    </p>
                    <p className="font-cormorant text-sm text-offwhite-muted/50 mt-1">
                      PNG, JPG, or WEBP
                    </p>
                  </div>
                )}
              </label>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={prevStep}
                className="font-cinzel text-sm tracking-wider px-8 py-3 border border-charcoal-light text-offwhite-muted hover:border-offwhite hover:text-offwhite transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="font-cinzel text-sm tracking-wider px-8 py-3 bg-magenta text-offwhite hover:bg-magenta-dark transition-colors disabled:opacity-50"
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
