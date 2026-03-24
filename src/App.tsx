import { useEffect } from 'react'
import './index.css'

function Logo() {
  return (
    <a href="#" className="flex items-center gap-3 group">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        className="text-offwhite group-hover:text-teal transition-colors"
      >
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      </svg>
      <span className="font-cinzel text-lg tracking-widest uppercase text-offwhite">
        Tower Reversed
      </span>
    </a>
  )
}

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-charcoal/95 backdrop-blur-sm border-b border-charcoal-light">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#services"
            className="font-cinzel text-sm tracking-wider text-offwhite-muted hover:text-offwhite transition-colors"
          >
            Services
          </a>
          <a
            href="#process"
            className="font-cinzel text-sm tracking-wider text-offwhite-muted hover:text-offwhite transition-colors"
          >
            Process
          </a>
          <a
            href="#booking"
            className="font-cinzel text-sm tracking-wider text-offwhite-muted hover:text-offwhite transition-colors"
          >
            About
          </a>
          <a
            href="#booking"
            className="font-cinzel text-sm tracking-wider px-5 py-2 border border-teal text-teal hover:bg-teal hover:text-charcoal transition-all"
          >
            Book a Session
          </a>
        </div>
      </div>
    </nav>
  )
}

function BaguaArt() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full h-full"
      fill="none"
    >
      {/* Outer octagon */}
      <polygon
        points="200,20 320,70 370,180 320,290 200,340 80,290 30,180 80,70"
        stroke="#3a3a3a"
        strokeWidth="1"
        fill="none"
      />
      {/* Inner octagon */}
      <polygon
        points="200,80 280,110 310,180 280,250 200,280 120,250 90,180 120,110"
        stroke="#3a3a3a"
        strokeWidth="1"
        fill="none"
      />
      {/* Center circle */}
      <circle cx="200" cy="180" r="50" stroke="#3a3a3a" strokeWidth="1" fill="none" />
      {/* Yin-yang simplified */}
      <path
        d="M200 130 A25 25 0 0 1 200 180 A25 25 0 0 0 200 230 A50 50 0 1 1 200 130"
        fill="#3a3a3a"
        opacity="0.3"
      />
      {/* Trigram lines - decorative */}
      <g stroke="#3a3a3a" strokeWidth="2" opacity="0.6">
        {/* Top trigram */}
        <line x1="180" y1="50" x2="220" y2="50" />
        <line x1="180" y1="58" x2="198" y2="58" />
        <line x1="202" y1="58" x2="220" y2="58" />
        <line x1="180" y1="66" x2="220" y2="66" />

        {/* Right trigram */}
        <line x1="340" y1="160" x2="340" y2="200" />
        <line x1="348" y1="160" x2="348" y2="178" />
        <line x1="348" y1="182" x2="348" y2="200" />
        <line x1="356" y1="160" x2="356" y2="200" />

        {/* Bottom trigram */}
        <line x1="180" y1="310" x2="220" y2="310" />
        <line x1="180" y1="318" x2="220" y2="318" />
        <line x1="180" y1="326" x2="198" y2="326" />
        <line x1="202" y1="326" x2="220" y2="326" />

        {/* Left trigram */}
        <line x1="44" y1="160" x2="44" y2="200" />
        <line x1="52" y1="160" x2="52" y2="200" />
        <line x1="60" y1="160" x2="60" y2="200" />
      </g>
      {/* Compass points */}
      <circle cx="200" cy="40" r="3" fill="#3a3a3a" />
      <circle cx="350" cy="180" r="3" fill="#3a3a3a" />
      <circle cx="200" cy="320" r="3" fill="#3a3a3a" />
      <circle cx="50" cy="180" r="3" fill="#3a3a3a" />
      {/* Diagonal compass points */}
      <circle cx="310" cy="80" r="2" fill="#3a3a3a" opacity="0.5" />
      <circle cx="310" cy="280" r="2" fill="#3a3a3a" opacity="0.5" />
      <circle cx="90" cy="280" r="2" fill="#3a3a3a" opacity="0.5" />
      <circle cx="90" cy="80" r="2" fill="#3a3a3a" opacity="0.5" />
    </svg>
  )
}

function Hero() {
  return (
    <section className="flex items-center h-screen">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="font-cinzel text-4xl md:text-5xl lg:text-6xl leading-tight text-offwhite mb-6">
            Your space holds more than you know.
          </h1>
          <p className="font-cormorant text-xl md:text-2xl text-offwhite-muted mb-10 leading-relaxed">
            Classical Feng Shui consultation rooted in ancient principles.
            We read the energy of your environment and guide you toward
            harmony, clarity, and intention.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="#booking"
              className="font-cinzel text-sm tracking-wider px-8 py-4 bg-magenta text-offwhite hover:bg-magenta-dark transition-colors"
            >
              Schedule a Consultation
            </a>
            <a
              href="#process"
              className="font-cormorant text-lg text-offwhite-muted hover:text-teal transition-colors border-b border-offwhite-muted hover:border-teal"
            >
              Learn about the process
            </a>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="bg-charcoal-dark p-8 aspect-square">
            <BaguaArt />
          </div>
        </div>
      </div>
    </section>
  )
}

const services = [
  {
    number: '01',
    title: 'Full home consultation',
    description:
      'A comprehensive analysis of your entire living space. We examine the flow of qi through each room, assess the land form, and provide detailed recommendations for harmonizing your home with classical Feng Shui principles.',
  },
  {
    number: '02',
    title: 'Single room focus',
    description:
      'Targeted guidance for a specific space — whether it\'s a bedroom seeking restful energy, a home office requiring focus, or a living area meant for gathering. Perfect for addressing particular concerns.',
  },
  {
    number: '03',
    title: 'New home assessment',
    description:
      'Before you commit to a purchase or rental, understand what energies you\'re inviting in. We evaluate prospective properties to help you make an informed decision aligned with your goals.',
  },
]

function Services() {
  return (
    <section id="services" className="py-24 border-t border-charcoal-light">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="font-cinzel text-sm tracking-[0.3em] uppercase text-teal mb-16">
          Services
        </h2>
        <div className="grid md:grid-cols-3 gap-12">
          {services.map((service) => (
            <div key={service.number} className="group">
              <span className="font-cinzel text-6xl text-charcoal-light group-hover:text-teal/30 transition-colors">
                {service.number}
              </span>
              <h3 className="font-cinzel text-xl text-offwhite mt-4 mb-4">
                {service.title}
              </h3>
              <p className="font-cormorant text-lg text-offwhite-muted leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const processSteps = [
  {
    number: '01',
    title: 'Book',
    description: 'Select a consultation type and schedule a time that works for you.',
  },
  {
    number: '02',
    title: 'Intake',
    description: 'Complete a brief questionnaire about your space, concerns, and intentions.',
  },
  {
    number: '03',
    title: 'Consult',
    description: 'We meet virtually or in-person to walk through your space together.',
  },
  {
    number: '04',
    title: 'Report',
    description: 'Receive a detailed written analysis with actionable recommendations.',
  },
]

function Process() {
  return (
    <section id="process" className="py-24 border-t border-charcoal-light">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="font-cinzel text-sm tracking-[0.3em] uppercase text-teal mb-16">
          Process
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          {processSteps.map((step) => (
            <div key={step.number} className="relative">
              <span className="font-cinzel text-8xl text-charcoal-light/50 absolute -top-4 -left-2 select-none">
                {step.number}
              </span>
              <div className="relative pt-16">
                <h3 className="font-cinzel text-xl text-teal mb-3">
                  {step.title}
                </h3>
                <p className="font-cormorant text-lg text-offwhite-muted italic leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Booking() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (function (C: any, A: string, L: string) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Cal = (window as any).Cal
    Cal('init', 'feng-shui-consultation', { origin: 'https://app.cal.com' })
    Cal.ns['feng-shui-consultation']('inline', {
      elementOrSelector: '#my-cal-inline-feng-shui-consultation',
      config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true' },
      calLink: 'almittelstaedt/feng-shui-consultation',
    })
    Cal.ns['feng-shui-consultation']('ui', {
      hideEventTypeDetails: false,
      layout: 'month_view',
    })
  }, [])

  return (
    <section id="booking" className="py-24 border-t border-charcoal-light">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-cinzel text-sm tracking-[0.3em] uppercase text-teal mb-8">
              Begin
            </h2>
            <h3 className="font-cinzel text-3xl md:text-4xl text-offwhite mb-6 leading-tight">
              Ready to transform your space?
            </h3>
            <p className="font-cormorant text-xl text-offwhite-muted leading-relaxed mb-6">
              Every consultation begins with understanding — your space, your
              goals, your life. We bring decades of study in classical Feng Shui
              to offer guidance that is both ancient and immediately practical.
            </p>
            <p className="font-cormorant text-xl text-offwhite-muted leading-relaxed">
              Book your session below, and take the first step toward a home
              that truly supports you.
            </p>
          </div>
          <div className="bg-charcoal-dark min-h-[900px]">
            <div
              id="my-cal-inline-feng-shui-consultation"
              style={{ width: '100%', height: '900px', overflow: 'hidden' }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="py-8 border-t border-charcoal-light mt-auto">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-cormorant text-sm text-offwhite-muted">
          &copy; {year} Tower Reversed. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <a
            href="#"
            className="font-cormorant text-sm text-offwhite-muted hover:text-offwhite transition-colors"
          >
            Privacy
          </a>
          <a
            href="#"
            className="font-cormorant text-sm text-offwhite-muted hover:text-offwhite transition-colors"
          >
            Terms
          </a>
          <a
            href="#"
            className="font-cormorant text-sm text-offwhite-muted hover:text-offwhite transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main>
        <Hero />
        <Services />
        <Process />
        <Booking />
      </main>
      <Footer />
    </div>
  )
}

export default App
