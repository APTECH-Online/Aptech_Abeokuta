import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for APTECH Abeokuta.'
}

export default function Privacy() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy policy"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy' }]}
      />
      <section className="section">
        <Container className="max-w-2xl">
          <div className="card p-8 sm:p-10">
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Last updated: {new Date().getFullYear()}</p>
            <div className="mt-6 space-y-8">
              <div>
                <h2 className="font-display font-semibold text-[1.05rem] text-[var(--color-ink)]">Information we collect</h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                  When you submit the enquiry form, the admissions application form, or contact us
                  by phone, WhatsApp, or email, we collect the details you provide — for example
                  your name, email address, phone number, and information about the programme
                  you're interested in. We do not collect payment card details through this website.
                </p>
              </div>
              <div>
                <h2 className="font-display font-semibold text-[1.05rem] text-[var(--color-ink)]">How we use it</h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                  We use the information you provide to respond to your enquiry, process your
                  application, and communicate with you about admissions, programmes, and campus
                  updates. We do not sell your personal information to third parties.
                </p>
              </div>
              <div>
                <h2 className="font-display font-semibold text-[1.05rem] text-[var(--color-ink)]">How it's stored</h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                  Application and enquiry data submitted through this site is stored in our
                  admissions system and retained for as long as needed to process your
                  application and maintain accurate academic and administrative records.
                </p>
              </div>
              <div>
                <h2 className="font-display font-semibold text-[1.05rem] text-[var(--color-ink)]">Your choices</h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                  You can ask us what information we hold about you, request a correction, or
                  request that it be removed, by contacting us at{' '}
                  <a href="mailto:aptech.abeokuta@gmail.com" className="font-semibold" style={{ color: 'var(--color-navy-900)' }}>aptech.abeokuta@gmail.com</a>.
                </p>
              </div>
              <p className="text-xs leading-relaxed pt-4" style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-line)' }}>
                This policy is a working draft intended to describe the site's actual data
                practices. It should be reviewed by qualified legal counsel before it is treated
                as a final, binding policy.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
