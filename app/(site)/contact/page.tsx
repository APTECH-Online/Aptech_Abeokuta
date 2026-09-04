import { siteConfig } from '../../../data/site'
import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import ContactForm from '../../../components/contact/ContactForm'
import { Mail, MapPin, Phone, Clock } from 'lucide-react'

export const metadata = {
  title: 'Contact',
  description: 'Contact APTECH Abeokuta — phone, email, address, and enquiry form.'
}

export default function Contact() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in touch"
        description="Have a question about a programme, admissions, or visiting the campus? Reach out — we're happy to help."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
      />

      <section className="section">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12">
            <div>
              <div className="grid gap-4">
                <div className="card p-5 flex items-start gap-4">
                  <MapPin aria-hidden="true" className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--color-teal-700)' }} />
                  <div>
                    <p className="font-semibold text-[var(--color-ink)] text-sm">Campus address</p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-body)' }}>{siteConfig.address}</p>
                  </div>
                </div>
                <div className="card p-5 flex items-start gap-4">
                  <Phone aria-hidden="true" className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--color-teal-700)' }} />
                  <div>
                    <p className="font-semibold text-[var(--color-ink)] text-sm">Phone / WhatsApp</p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-body)' }}>{siteConfig.phone}</p>
                  </div>
                </div>
                <div className="card p-5 flex items-start gap-4">
                  <Mail aria-hidden="true" className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--color-teal-700)' }} />
                  <div>
                    <p className="font-semibold text-[var(--color-ink)] text-sm">Email</p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-body)' }}>{siteConfig.email}</p>
                  </div>
                </div>
                <div className="card p-5 flex items-start gap-4">
                  <Clock aria-hidden="true" className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--color-teal-700)' }} />
                  <div>
                    <p className="font-semibold text-[var(--color-ink)] text-sm">Office hours</p>
                    <ul className="mt-1 text-sm space-y-0.5" style={{ color: 'var(--color-body)' }}>
                      {siteConfig.hours.map((h) => (
                        <li key={h.day} className="flex justify-between gap-6">
                          <span>{h.day}</span>
                          <span>{h.time}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div
                className="mt-4 w-full h-56 rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--color-line)' }}
              >
                <iframe
                  title="Map showing the APTECH Abeokuta campus address"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(siteConfig.address + ', Abeokuta, Nigeria')}&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            <div className="card p-6 sm:p-8">
              <h2 className="h-section">Send a message</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                We typically respond within one to two business days.
              </p>
              <ContactForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
