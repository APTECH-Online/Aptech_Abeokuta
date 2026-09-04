import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'

export const metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions for APTECH Abeokuta.'
}

export default function Terms() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms & conditions"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Terms' }]}
      />
      <section className="section">
        <Container className="max-w-2xl">
          <div className="card p-8 sm:p-10">
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Last updated: {new Date().getFullYear()}</p>
            <div className="mt-6 space-y-8">
              <div>
                <h2 className="font-display font-semibold text-[1.05rem] text-[var(--color-ink)]">Enrolment &amp; admission</h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                  A place on a programme is confirmed once the admissions office has reviewed
                  your application, confirmed you meet the entry requirements for that programme,
                  and received the applicable registration payment.
                </p>
              </div>
              <div>
                <h2 className="font-display font-semibold text-[1.05rem] text-[var(--color-ink)]">Fees &amp; payment</h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                  Programme fees, instalment options, and payment deadlines are confirmed
                  directly with the admissions office at the time of enrolment, since they can
                  vary by programme and intake.
                </p>
              </div>
              <div>
                <h2 className="font-display font-semibold text-[1.05rem] text-[var(--color-ink)]">Attendance</h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                  Regular attendance is expected for all instructor-led sessions and lab time.
                  Students who anticipate missing a session should notify their instructor or
                  the admissions office in advance where possible.
                </p>
              </div>
              <div>
                <h2 className="font-display font-semibold text-[1.05rem] text-[var(--color-ink)]">Conduct</h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                  Students are expected to treat instructors, staff, and fellow students with
                  respect, and to use campus equipment and facilities responsibly.
                </p>
              </div>
              <div>
                <h2 className="font-display font-semibold text-[1.05rem] text-[var(--color-ink)]">Certification</h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                  Students who complete a programme's requirements receive a certificate of
                  completion. Ask the admissions office for the certification details specific
                  to your track.
                </p>
              </div>
              <p className="text-xs leading-relaxed pt-4" style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-line)' }}>
                These terms are a working draft intended to describe the institution's actual
                enrolment and conduct policies. They should be reviewed by qualified legal
                counsel before they are treated as final, binding terms.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
